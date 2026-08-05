// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DeliveryEscrow
 * @dev Manages SME proof-of-delivery escrows on Base with hashed PIN code release support.
 */
contract DeliveryEscrow {
    enum DeliveryStatus { Created, PickedUp, Delivered, Dispute }

    struct Parcel {
        uint256 id;
        address payable sme;
        address payable courier;
        address receiver;
        uint256 escrowAmount;
        bytes32 confirmationHash; // keccak256 hash of the secret PIN
        string ipfsHash;
        DeliveryStatus status;
        bool isCompleted;
    }

    uint256 public parcelCount;
    mapping(uint256 => Parcel) public parcels;

    // Events
    event ParcelCreated(
        uint256 indexed id,
        address indexed sme,
        address indexed receiver,
        uint256 amount,
        bytes32 confirmationHash,
        string ipfsHash
    );
    event ParcelPickedUp(uint256 indexed id, address indexed courier);
    event DeliveryConfirmed(uint256 indexed id, address indexed courier, uint256 payoutAmount);
    event DisputeRaised(uint256 indexed id, address indexed raisedBy);

    modifier onlySME(uint256 _id) {
        require(msg.sender == parcels[_id].sme, "Only SME can call this");
        _;
    }

    modifier onlyReceiver(uint256 _id) {
        require(msg.sender == parcels[_id].receiver, "Only Receiver can confirm delivery");
        _;
    }

    /**
     * @notice SME creates a delivery parcel and deposits the payment into escrow.
     * @param _receiver Wallet address of the delivery recipient (or address(0) if receiver operates via PIN/Email only).
     * @param _confirmationHash keccak256 hash of the secret delivery PIN.
     * @param _ipfsHash Pinata CID storing package metadata.
     */
    function createParcel(
        address _receiver,
        bytes32 _confirmationHash,
        string memory _ipfsHash
    ) external payable {
        require(msg.value > 0, "Escrow payment must be greater than zero");

        parcelCount++;
        parcels[parcelCount] = Parcel({
            id: parcelCount,
            sme: payable(msg.sender),
            courier: payable(address(0)),
            receiver: _receiver,
            escrowAmount: msg.value,
            confirmationHash: _confirmationHash,
            ipfsHash: _ipfsHash,
            status: DeliveryStatus.Created,
            isCompleted: false
        });

        emit ParcelCreated(parcelCount, msg.sender, _receiver, msg.value, _confirmationHash, _ipfsHash);
    }

    /**
     * @notice Courier registers to accept and transport the parcel.
     * @param _id Parcel ID.
     */
    function acceptParcel(uint256 _id) external {
        Parcel storage parcel = parcels[_id];
        require(parcel.id != 0, "Parcel does not exist");
        require(parcel.status == DeliveryStatus.Created, "Parcel is not available for pickup");
        require(parcel.courier == address(0), "Courier already assigned");
        require(msg.sender != parcel.sme, "SME cannot act as courier");

        parcel.courier = payable(msg.sender);
        parcel.status = DeliveryStatus.PickedUp;

        emit ParcelPickedUp(_id, msg.sender);
    }

    /**
     * @notice Releases locked escrow funds to the courier by verifying the raw secret PIN code.
     * @dev Can be triggered by the courier, SME, or receiver as long as the secret PIN hashes correctly.
     * @param _id Parcel ID.
     * @param _secretCode Plaintext PIN code provided by the package receiver upon delivery.
     */
    function confirmDeliveryWithCode(uint256 _id, string memory _secretCode) external {
        Parcel storage parcel = parcels[_id];
        require(parcel.status == DeliveryStatus.PickedUp, "Parcel not picked up yet");
        require(!parcel.isCompleted, "Escrow already released");
        require(parcel.courier != address(0), "No courier assigned");

        // Verify that hashing the raw PIN matches the stored confirmation hash
        require(
            keccak256(abi.encodePacked(_secretCode)) == parcel.confirmationHash,
            "Invalid delivery secret code"
        );

        _finalizeAndPayCourier(parcel);
    }

    /**
     * @notice Receiver validates proof of delivery directly via Web3 wallet signature.
     * @param _id Parcel ID.
     */
    function confirmDelivery(uint256 _id) external onlyReceiver(_id) {
        Parcel storage parcel = parcels[_id];
        require(parcel.status == DeliveryStatus.PickedUp, "Parcel not picked up yet");
        require(!parcel.isCompleted, "Escrow already released");
        require(parcel.courier != address(0), "No courier assigned");

        _finalizeAndPayCourier(parcel);
    }

    /**
     * @notice SME can manually release escrow payment to courier if receiver PIN is lost.
     * @param _id Parcel ID.
     */
    function manualConfirmBySME(uint256 _id) external onlySME(_id) {
        Parcel storage parcel = parcels[_id];
        require(parcel.status == DeliveryStatus.PickedUp, "Parcel not picked up yet");
        require(!parcel.isCompleted, "Escrow already released");
        require(parcel.courier != address(0), "No courier assigned");

        _finalizeAndPayCourier(parcel);
    }

    /**
     * @notice Raises a dispute if delivery encounters an issue.
     * @param _id Parcel ID.
     */
    function raiseDispute(uint256 _id) external {
        Parcel storage parcel = parcels[_id];
        require(
            msg.sender == parcel.sme || msg.sender == parcel.receiver || msg.sender == parcel.courier,
            "Not authorized to raise dispute"
        );
        require(!parcel.isCompleted, "Cannot dispute completed delivery");

        parcel.status = DeliveryStatus.Dispute;
        emit DisputeRaised(_id, msg.sender);
    }

    /**
     * @dev Internal helper function to mark parcel complete and transfer ETH to courier safely.
     */
    function _finalizeAndPayCourier(Parcel storage parcel) internal {
        parcel.status = DeliveryStatus.Delivered;
        parcel.isCompleted = true;

        uint256 payout = parcel.escrowAmount;
        
        // Reentrancy safety check & transfer via .call
        (bool success, ) = parcel.courier.call{value: payout}("");
        require(success, "ETH transfer to courier failed");

        emit DeliveryConfirmed(parcel.id, parcel.courier, payout);
    }
}