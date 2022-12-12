// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165CheckerUpgradeable.sol";
import "./IArtist.sol";
import "./SampleNFT.sol";
import "./ISettings.sol";
import "hardhat/console.sol";

contract Agreement is ERC721HolderUpgradeable, AccessControlUpgradeable {
    // Modifiers
    modifier onlyArtist() {
        require(isArtist(msg.sender), "not artist");
        _;
    }

    modifier validAdhesion(address _contract) {
        require(
            ERC165CheckerUpgradeable.supportsInterface(
                _contract,
                type(IArtist).interfaceId
            ),
            "The contract does not implement the Artist interface"
        );
        require(
            IArtist(payable(_contract)).getArtistAddress() == msg.sender,
            "Sender is not the owner of supplied voter contract"
        );
        _;
    }

    // Events
    event Init(
        address _collectionAddress,
        uint256 _tokenId,
        address[] _artists,
        address _initialOwner
    );
    event VoteResult(uint __royaltiesInBps, uint _nftTier, bool _exploitable);
    event ForSale(uint _price);
    event Purchase(address indexed _buyer, uint _value);
    event Redeem(address indexed _artist, uint _value);
    event Canceled(address admin);
    event NewVote(
        address _artist,
        uint _royaltiesInBps,
        uint _ownShare,
        Tier _nftTier,
        bool _exploitable
    );

    // Structs
    struct Vote {
        uint royaltiesInBps;
        uint ownShare;
        Tier nftTier;
        bool exploitable;
    }

    struct Artist {
        bool hasVoted;
        Vote vote;
        bool isArtist;
        uint balance;
    }

    //Enums
    enum State {
        Uninitialized,
        Initialized,
        ForSale,
        Redeemable,
        Canceled
    }

    enum Tier {
        Silver,
        Gold,
        Platinium
    }

    // State variables

    mapping(address => Artist) public artistMapping;
    address[] public artistList;
    State public contractState;

    address settings;
    uint[3] public tierPrice;
    uint saleTier;
    uint royaltiesInBps;
    bool exploitable;
    uint bpsBasis;
    uint public tyxitBalance;

    // These are for checking agreement validity for each artist
    uint maxPreconditionTier;
    uint maxPreconditionRoyaltiesInBps;

    IERC721 collection;
    address payable public collectionAddress;
    uint tokenId;

    bytes32 public TYXIT_ROLE;

    // Public / External functions

    function initialize(
        uint256 _tokenId,
        address[] memory _artists,
        address _initialOwner,
        address _settings
    ) external initializer {
        __AccessControl_init();
        __ERC721Holder_init();
        TYXIT_ROLE = keccak256("TYXIT_ROLE");
        settings = _settings;
        collectionAddress = ISettings(settings).collectionAddress();
        _setupRole(TYXIT_ROLE, ISettings(settings).administrator());
        bpsBasis = 10000;

        for (uint i = 0; i < _artists.length; i++) {
            address artist = _artists[i];
            require(artist != address(0), "invalid artist");
            newArtist(artist);
            artistList.push(artist);
        }

        collection = IERC721(collectionAddress);
        collection.safeTransferFrom(_initialOwner, address(this), _tokenId);
        tokenId = _tokenId;
        contractState = State.Initialized;
        tierPrice = ISettings(settings).getTierPrices();
        emit Init(collectionAddress, _tokenId, _artists, _initialOwner);
    }

    function getBalance() external view returns (uint _balance) {
        if (msg.sender == ISettings(settings).feeReceiver()) {
            return tyxitBalance;
        } else {
            return artistMapping[msg.sender].balance;
        }
    }

    function purchase() external payable {
        require(contractState == State.ForSale, "Can not purchase yet");
        require(msg.value == tierPrice[saleTier], "Not enough ether sent");

        collection.transferFrom(address(this), msg.sender, tokenId);
        contractState = State.Redeemable;
        splitEther(msg.value);
        emit Purchase(msg.sender, msg.value);
    }

    receive() external payable {
        require(contractState == State.Redeemable || contractState == State.ForSale);
        splitEther(msg.value);
    }

    function getState() public view returns (State) {
        return contractState;
    }

    function cancelAgreement() public onlyRole(TYXIT_ROLE) {
        contractState = State.Canceled;
        emit Canceled(msg.sender);
    }

    function redeem_artist(
        address _adhesion
    ) external onlyArtist validAdhesion(_adhesion) {
        require(
            contractState == State.Redeemable ||
                contractState == State.Canceled,
            "Contract not in Redeemable or Canceled state"
        );

        uint toRedeem = artistMapping[msg.sender].balance;
        artistMapping[msg.sender].balance = 0;
        sendViaCall(payable(_adhesion), toRedeem);
        emit Redeem(msg.sender, toRedeem);
    }

    function redeem_tyxit() external {
        require(
            contractState == State.Redeemable ||
                contractState == State.Canceled,
            "Contract not in Redeemable or Canceled state"
        );
        require(msg.sender == ISettings(settings).feeReceiver(), "Caller is not fee receiver");

        uint toRedeem = tyxitBalance;
        address payable tyxitAddress = ISettings(settings).feeReceiver();
        tyxitBalance = 0;

        sendViaCall(tyxitAddress, toRedeem);
        emit Redeem(msg.sender, toRedeem);
    }

    function isArtist(
        address artistAddress
    ) public view returns (bool isIndeed) {
        return artistMapping[artistAddress].isArtist;
    }

    function putForSale() external onlyArtist {
        require(
            contractState == State.Initialized,
            "Contract not in Initialized state"
        );

        uint totalTier = 0;
        uint totalShareInBps = 0;
        uint totalRoyaltiesInBps = 0;

        for (uint i = 0; i < artistList.length; i++) {
            require(
                artistMapping[artistList[i]].hasVoted,
                "Every artist should vote"
            );
            exploitable = i == 0
                ? artistMapping[artistList[i]].vote.exploitable
                : exploitable && artistMapping[artistList[i]].vote.exploitable;
            totalTier += uint(artistMapping[artistList[i]].vote.nftTier);
            totalShareInBps += uint(artistMapping[artistList[i]].vote.ownShare);
            totalRoyaltiesInBps += uint(
                artistMapping[artistList[i]].vote.royaltiesInBps
            );
        }

        require(
            totalShareInBps <= bpsBasis,
            "All shares should not exceed 100%"
        );
        saleTier = uint(totalTier / artistList.length);
        royaltiesInBps = uint(totalRoyaltiesInBps / artistList.length);

        require(
            checkVoteValidity(
                saleTier,
                royaltiesInBps,
                maxPreconditionTier,
                maxPreconditionRoyaltiesInBps
            ),
            "Resulting agreement terms do not respect every preconditions"
        );

        contractState = State.ForSale;
        emit VoteResult(royaltiesInBps, saleTier, exploitable);

        SampleNFT(collectionAddress).setTokenRoyalty(
            tokenId,
            address(this),
            uint96(royaltiesInBps)
        );

        emit ForSale(tierPrice[saleTier]);
    }

    function vote(
        uint _royaltiesInBps,
        uint _ownShareInBps,
        Tier _nftTier,
        bool _exploitable,
        address _voter
    ) external onlyArtist validAdhesion(_voter) {
        require(
            contractState == State.Initialized,
            "Contract not in Initialized state"
        );
        require(
            _royaltiesInBps <= bpsBasis,
            "Royalties should not exceed 100 percent"
        );
        require(
            _ownShareInBps <= bpsBasis,
            "Own share should not exceed 100 percent"
        );

        (uint currPreconditionRoyalties, uint currPreconditionTier) = IArtist(
            payable(_voter)
        ).getPreconditions();

        require(
            checkVoteValidity(
                uint(_nftTier),
                _royaltiesInBps,
                currPreconditionTier,
                currPreconditionRoyalties
            ),
            "Vote is not compatible with preconditions"
        );

        // Setting the contract-wide strictest precondition

        maxPreconditionRoyaltiesInBps = max(
            maxPreconditionRoyaltiesInBps,
            currPreconditionRoyalties
        );
        maxPreconditionTier = max(maxPreconditionTier, currPreconditionTier);

        Vote memory currentVote = Vote(
            _royaltiesInBps,
            _ownShareInBps,
            _nftTier,
            _exploitable
        );
        artistMapping[msg.sender].hasVoted = true;
        artistMapping[msg.sender].vote = currentVote;

        emit NewVote(
            msg.sender,
            _royaltiesInBps,
            _ownShareInBps,
            _nftTier,
            _exploitable
        );
    }

    // Internal / Private functions

    function checkVoteValidity(
        uint _votedTier,
        uint _votedRoyalty,
        uint tierPrecondition,
        uint royaltyPrecondition
    ) internal pure returns (bool isValid) {
        return
            _votedTier >= tierPrecondition &&
            _votedRoyalty >= royaltyPrecondition;
    }

    function sendViaCall(address payable _to, uint _value) internal {
        require(
            _value <= address(this).balance,
            "Not enough ether in balance."
        );

        (bool sent, ) = _to.call{value: _value}("");
        require(sent, "Failed to send Ether");
    }

    function max(uint a, uint b) internal pure returns (uint) {
        return a >= b ? a : b;
    }

    function newArtist(address artistAddress) internal {
        require(!isArtist(artistAddress));
        artistMapping[artistAddress].hasVoted = false;
        artistMapping[artistAddress].isArtist = true;
    }

    function calculateFee(uint _amount) internal view returns (uint _fee) {
        return (ISettings(settings).feeAmount() * _amount) / bpsBasis;
    }

    function calculateArtistAmount(
        uint _total,
        address _artist
    ) internal view returns (uint _amount) {
        require(isArtist(_artist), "Address provided is not an artist");
        return (_total * artistMapping[_artist].vote.ownShare) / bpsBasis;
    }

    function splitEther(uint _ethReceived) internal {
        uint amountTyxit = calculateFee(_ethReceived);
        uint amountArtists = _ethReceived - amountTyxit;

        tyxitBalance += amountTyxit;
        for (uint i = 0; i < artistList.length; i++) {
            uint amountArtist = calculateArtistAmount(
                amountArtists,
                artistList[i]
            );
            artistMapping[artistList[i]].balance += amountArtist;
        }
    }
}
