// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

//https://ethereum.stackexchange.com/questions/13167/are-there-well-solved-and-simple-storage-patterns-for-solidity

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "./IArtist.sol";

contract Agreement is ERC721Holder, AccessControl {
    // Events
    event Init(
        address _collectionAddress,
        uint256 _tokenId,
        address[] _artists,
        address _initialOwner
    );
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

    struct Vote {
        uint royaltiesInBps;
        uint ownShare;
        Tier nftTier;
        bool exploitable;
    }

    struct Artist {
        bool proposed;
        Vote vote;
        bool isArtist;
        bool hasRedeem;
    }
    mapping(address => Artist) public artistMapping;
    address[] public artistList;

    enum State {
        Uninitialized,
        Initialized,
        ForSale,
        Redeemable,
        Canceled
    }
    State public contractState;

    enum Tier {
        Silver,
        Gold,
        Platinium
    }
    uint[3] tierPrice = [1, 10, 100];
    uint saleTier;
    uint sellingPrice;

    IERC721 collection;
    address collection_address;
    uint tokenId;

    // Check if the NFT implements ERC2981
    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;
    bytes32 public constant TYXIT_ROLE = keccak256("TYXIT_ROLE");
    address public constant TYXIT_ADMIN =
        0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc;

    modifier onlyArtist() {
        require(isArtist(msg.sender), "not artist");
        _;
    }

    function getState() public view returns (State) {
        return contractState;
    }

    function cancelAgreement() public onlyRole(TYXIT_ROLE) {
        contractState = State.Canceled;
        emit Canceled(msg.sender);
    }

    function max(uint a, uint b) internal pure returns (uint) {
        return a >= b ? a : b;
    }

    function isArtist(
        address artistAddress
    ) public view returns (bool isIndeed) {
        return artistMapping[artistAddress].isArtist;
    }

    function newArtist(address artistAddress) internal {
        require(!isArtist(artistAddress));
        artistMapping[artistAddress].proposed = false;
        artistMapping[artistAddress].isArtist = true;
        artistMapping[artistAddress].hasRedeem = false;
    }

    function vote(
        uint _royaltiesInBps,
        uint _ownShareInBps,
        Tier _nftTier,
        bool _exploitable,
        address _voter
    ) external onlyArtist {
        require(contractState == State.Initialized);
        require(
            _royaltiesInBps <= 10000,
            "Royalties must not exceed 100 percent"
        );
        require(
            _ownShareInBps <= 10000,
            "Own share must not exceed 100 percent"
        );
        require(
            ERC165Checker.supportsInterface(_voter, type(IArtist).interfaceId),
            "The contract does not implement the Artist interface"
        );
        require(
            IArtist(payable(_voter)).getArtistAddress() == msg.sender,
            "Sender is not the owner of supplied voter contract"
        );

        require(
            IArtist(payable(_voter)).checkAgreementValidity(
                _royaltiesInBps,
                uint(_nftTier)
            ),
            "Vote is not compatible with preconditions"
        );
        Vote memory currentVote = Vote(
            _royaltiesInBps,
            _ownShareInBps,
            _nftTier,
            _exploitable
        );
        artistMapping[msg.sender].proposed = true;
        artistMapping[msg.sender].vote = currentVote;
        emit NewVote(
            msg.sender,
            _royaltiesInBps,
            _ownShareInBps,
            _nftTier,
            _exploitable
        );
    }

    function putForSale() external onlyArtist {
        require(
            contractState == State.Initialized,
            "Contract not initialized yet"
        );
        // For now, an average on tier proposed is computed.
        // Round floor is used
        uint totalTier = 0;
        for (uint i = 0; i < artistList.length; i++) {
            require(
                artistMapping[artistList[i]].proposed,
                "Every artist must propose a price"
            );
            totalTier += uint(artistMapping[artistList[i]].vote.nftTier);
        }

        contractState = State.ForSale;
        saleTier = uint(totalTier / artistList.length);
        emit ForSale(saleTier);
    }

    function initialize(
        address _collectionAddress,
        uint256 _tokenId,
        address[] memory _artists,
        address _initialOwner
    ) external {
        require(contractState == State.Uninitialized, "Already initialized");
        _setupRole(TYXIT_ROLE, TYXIT_ADMIN);

        for (uint i = 0; i < _artists.length; i++) {
            address artist = _artists[i];
            require(artist != address(0), "invalid artist");
            newArtist(artist);
            artistList.push(artist);
        }

        collection = IERC721(_collectionAddress);
        collection_address = _collectionAddress;
        collection.safeTransferFrom(_initialOwner, address(this), _tokenId);
        tokenId = _tokenId;
        contractState = State.Initialized;
        emit Init(_collectionAddress, _tokenId, _artists, _initialOwner);
    }

    function purchase() external payable {
        require(contractState == State.ForSale, "Can not purchase yet");
        require(msg.value >= tierPrice[saleTier], "Not enough ether sent");

        collection.transferFrom(address(this), msg.sender, tokenId);
        contractState = State.Redeemable;

        sellingPrice = msg.value;
        emit Purchase(msg.sender, msg.value);
    }

    function redeem() external onlyArtist {
        require(
            contractState == State.Redeemable ||
                contractState == State.Canceled,
            "Can not redeem yet"
        );
        require(
            !artistMapping[msg.sender].hasRedeem,
            "Artist has already redeemed"
        );
        artistMapping[msg.sender].hasRedeem = true;
        // TO-DO: Vérifier opération
        // uint256 toRedeem = ownersStruct[msg.sender].share * tierPrice[saleTier] / 100;

        uint256 toRedeem = sellingPrice / artistList.length;
        sendViaCall(payable(msg.sender), toRedeem);
        emit Redeem(msg.sender, toRedeem);
    }

    function sendViaCall(address payable _to, uint _value) internal {
        (bool sent, ) = _to.call{value: _value}("");
        require(sent, "Failed to send Ether");
    }
}
