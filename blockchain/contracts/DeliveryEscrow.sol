// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DeliveryEscrow
 * @dev Manages SME proof-of-delivery escrows with courier assignment,
 *      hashed PIN confirmation, and escrow payment.
 */
contract DeliveryEscrow {
    enum DeliveryStatus {
        Created,
        Accepted,
        PickedUp,
        InTransit,
        Delivered,
        Dispute
    }

    struct Parcel {
        uint256 id;

        // Receiver information
        string receiverPhone;
        string destinationAddress;

        // Package information
        string contentsName;
        string ipfsHash;

        // Participants
        address payable sme;
        address payable courier;

        // Payment
        uint256 escrowAmount;

        // Delivery confirmation
        bytes32 confirmationHash;

        // Status
        DeliveryStatus status;
        bool isCompleted;
    }

    uint256 public parcelCount;

    mapping(uint256 => Parcel) public parcels;

    // ============================================================
    // EVENTS
    // ============================================================

    /**
     * @dev Emitted whenever a new delivery becomes available.
     *
     * Your backend/frontend can listen for this event and notify
     * available couriers.
     */
    event ParcelCreated(
        uint256 indexed id,
        address indexed sme,
        string receiverPhone,
        string destinationAddress,
        string contentsName,
        uint256 amount,
        bytes32 confirmationHash,
        string ipfsHash
    );

    /**
     * @dev Emitted when a courier accepts a delivery.
     */
    event ParcelAccepted(
        uint256 indexed id,
        address indexed courier
    );

    /**
     * @dev Emitted when the courier physically picks up the parcel.
     */
    event ParcelPickedUp(
        uint256 indexed id,
        address indexed courier
    );

    /**
     * @dev Emitted when delivery is confirmed and payment is released.
     */
    event DeliveryConfirmed(
        uint256 indexed id,
        address indexed courier,
        uint256 payoutAmount
    );

    /**
     * @dev Emitted when a dispute is raised.
     */
    event DisputeRaised(
        uint256 indexed id,
        address indexed raisedBy
    );

    // ============================================================
    // MODIFIERS
    // ============================================================

    modifier onlySME(uint256 _id) {
        require(
            msg.sender == parcels[_id].sme,
            "Only SME can call this"
        );
        _;
    }

    modifier onlyCourier(uint256 _id) {
        require(
            msg.sender == parcels[_id].courier,
            "Only assigned courier can call this"
        );
        _;
    }

    // ============================================================
    // CREATE PARCEL
    // ============================================================

    /**
     * @notice SME creates a delivery parcel and deposits payment
     *         into escrow.
     *
     * @param _receiverPhone Phone number of the receiver.
     * @param _destinationAddress Receiver's destination/pickup address.
     * @param _contentsName Description/name of the package contents.
     * @param _confirmationHash keccak256 hash of the delivery PIN.
     * @param _ipfsHash Pinata/IPFS CID containing package metadata/photo.
     *
     * The courier is NOT supplied here.
     * courier starts as address(0) and is assigned when a courier
     * accepts the delivery.
     */
    function createParcel(
        string memory _receiverPhone,
        string memory _destinationAddress,
        string memory _contentsName,
        bytes32 _confirmationHash,
        string memory _ipfsHash
    ) external payable {
        require(
            msg.value > 0,
            "Escrow payment must be greater than zero"
        );

        require(
            bytes(_receiverPhone).length > 0,
            "Receiver phone is required"
        );

        require(
            bytes(_destinationAddress).length > 0,
            "Destination address is required"
        );

        require(
            bytes(_contentsName).length > 0,
            "Package contents are required"
        );

        require(
            _confirmationHash != bytes32(0),
            "Confirmation PIN hash is required"
        );

        parcelCount++;

        parcels[parcelCount] = Parcel({
            id: parcelCount,

            receiverPhone: _receiverPhone,
            destinationAddress: _destinationAddress,

            contentsName: _contentsName,
            ipfsHash: _ipfsHash,

            sme: payable(msg.sender),

            // No courier at creation time
            courier: payable(address(0)),

            escrowAmount: msg.value,

            confirmationHash: _confirmationHash,

            status: DeliveryStatus.Created,

            isCompleted: false
        });

        emit ParcelCreated(
            parcelCount,
            msg.sender,
            _receiverPhone,
            _destinationAddress,
            _contentsName,
            msg.value,
            _confirmationHash,
            _ipfsHash
        );
    }

    // ============================================================
    // COURIER ACCEPTS DELIVERY
    // ============================================================

    /**
     * @notice Allows any available courier to accept an available
     *         delivery.
     *
     * The courier address is automatically taken from msg.sender.
     */
    function acceptParcel(uint256 _id) external {
        Parcel storage parcel = parcels[_id];

        require(
            parcel.id != 0,
            "Parcel does not exist"
        );

        require(
            parcel.status == DeliveryStatus.Created,
            "Parcel is not available"
        );

        require(
            parcel.courier == address(0),
            "Courier already assigned"
        );

        require(
            msg.sender != parcel.sme,
            "SME cannot act as courier"
        );

        // The wallet that calls this function becomes the courier.
        parcel.courier = payable(msg.sender);

        parcel.status = DeliveryStatus.Accepted;

        emit ParcelAccepted(
            _id,
            msg.sender
        );
    }

    // ============================================================
    // COURIER PICKS UP PARCEL
    // ============================================================

    /**
     * @notice Courier marks the parcel as picked up.
     */
    function markPickedUp(uint256 _id)
        external
        onlyCourier(_id)
    {
        Parcel storage parcel = parcels[_id];

        require(
            parcel.status == DeliveryStatus.Accepted,
            "Parcel has not been accepted"
        );

        parcel.status = DeliveryStatus.PickedUp;

        emit ParcelPickedUp(
            _id,
            msg.sender
        );
    }

    // ============================================================
    // DELIVERY CONFIRMATION USING PIN
    // ============================================================

    /**
     * @notice Confirms delivery by checking the receiver's secret PIN.
     *
     * Anyone with the correct PIN can trigger the payment.
     * This is useful because the receiver does not need a Web3 wallet.
     */
    function confirmDeliveryWithCode(
        uint256 _id,
        string memory _secretCode
    ) external {
        Parcel storage parcel = parcels[_id];

        require(
            parcel.id != 0,
            "Parcel does not exist"
        );

        require(
            !parcel.isCompleted,
            "Escrow already released"
        );

        // Automatically assign courier if not yet set
        if (parcel.courier == address(0)) {
            parcel.courier = payable(msg.sender);
        }

        require(
            keccak256(abi.encodePacked(_secretCode)) == parcel.confirmationHash,
            "Invalid delivery secret code"
        );

        _finalizeAndPayCourier(parcel);
    }

    // ============================================================
    // SME MANUAL CONFIRMATION
    // ============================================================

    /**
     * @notice Allows the SME to manually release the escrow
     *         if the receiver cannot provide the PIN.
     */
    function manualConfirmBySME(uint256 _id)
        external
        onlySME(_id)
    {
        Parcel storage parcel = parcels[_id];

        require(
            parcel.status == DeliveryStatus.PickedUp,
            "Parcel has not been picked up"
        );

        require(
            !parcel.isCompleted,
            "Escrow already released"
        );

        require(
            parcel.courier != address(0),
            "No courier assigned"
        );

        _finalizeAndPayCourier(parcel);
    }

    // ============================================================
    // DISPUTE
    // ============================================================

    /**
     * @notice SME, receiver or assigned courier can raise a dispute.
     *
     * Since the receiver is identified by phone rather than a wallet,
     * the receiver cannot directly call this blockchain function.
     * Your application can instead provide a dispute flow through
     * the SME/courier or backend system.
     */
    function raiseDispute(uint256 _id) external {
        Parcel storage parcel = parcels[_id];

        require(
            parcel.id != 0,
            "Parcel does not exist"
        );

        require(
            msg.sender == parcel.sme ||
            msg.sender == parcel.courier,
            "Not authorized to raise dispute"
        );

        require(
            !parcel.isCompleted,
            "Cannot dispute completed delivery"
        );

        parcel.status = DeliveryStatus.Dispute;

        emit DisputeRaised(
            _id,
            msg.sender
        );
    }

    // ============================================================
    // INTERNAL PAYMENT
    // ============================================================

    /**
     * @dev Marks the delivery as completed and releases the escrow
     *      to the assigned courier.
     */
    function _finalizeAndPayCourier(
        Parcel storage parcel
    ) internal {
        uint256 payout = parcel.escrowAmount;

        // Update state BEFORE external transfer.
        parcel.status = DeliveryStatus.Delivered;
        parcel.isCompleted = true;
        parcel.escrowAmount = 0;

        (bool success, ) = parcel.courier.call{
            value: payout
        }("");

        require(
            success,
            "ETH transfer to courier failed"
        );

        emit DeliveryConfirmed(
            parcel.id,
            parcel.courier,
            payout
        );
    }
}