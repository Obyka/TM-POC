// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./Agreement.sol";

/// @title Tyxit - FactoryCloneAgreement
/// @author Florian Polier
/// @notice This contract creates and manages Agreement contracts between artists
contract FactoryCloneAgreement {
    address public immutable agreementImpl;
    address public immutable settings;

    mapping(address => address) public agreementToContract;
    event AgreementCreated(address[] _coArtists, address _contract);

    /**
     * @dev Constructor function that initializes the contract
     * @param _settings The address of a Settings contract
     */
    constructor(address _settings) {
        require(_settings != address(0));
        agreementImpl = address(new Agreement());
        settings = _settings;
    }

    /**
     * @dev Creates a deterministic clone of an initialized Agreement contract
     * @param _artists The list of artists associated with the cloned contract
     * @param _tokenId The ID of the token to be associated with the cloned contract
     * @param salt The bytes32 containing the salt for the cloned contract
     * @return The address of the cloned contract
     */
    function createAgreement(
        address[] memory _artists,
        uint _tokenId,
        bytes32 salt
    ) external returns (address) {
        address clone = Clones.cloneDeterministic(agreementImpl, salt);
        agreementToContract[msg.sender] = clone;
        emit AgreementCreated(_artists, clone);
        Agreement(payable(clone)).initialize(
            _tokenId,
            _artists,
            msg.sender,
            settings
        );
        return clone;
    }

    /**
     * @dev Predicts the deterministic address of a cloned contract
     * @param implementation The address of the class to be cloned
     * @param salt The bytes32 containing the salt of the contract
     * @return predicted The predicted address of the cloned contract
     */
    function predictDeterministicAddress(
        address implementation,
        bytes32 salt
    ) public view returns (address predicted) {
        address cloneAddress = Clones.predictDeterministicAddress(
            implementation,
            salt
        );
        return cloneAddress;
    }
}
