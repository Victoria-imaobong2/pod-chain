// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DeliveryEscrow
 * @dev Manages SME proof-of-delivery escrows on Base.
 */

 contract DeliveryEscrow {
    enum DeliveryStatus { Created, PickedUp, InTransit, Delivered, Dispute }

    struct Parcel {
        uint256 id;
        address payable sme;
        address payable courier;
        address receiver;
        uint256 escrowAmount;
        string ipfsHash;
        DeliveryStatus status;
        bool isCompleted;
    }

    uint256 public parcelCount;
    mapping(uint256 => Parcel) public parcels;

    //Events
    event ParcelCreated(uint256 indexed id, address indexed sme, address indexed receiver, uint256 amount, string ipfsHash);
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

    modifier onlyCourier(uint256 _id) {
        require(msg.sender == parcels[_id].courier, "Only assigned Courier can call this");
        _;
    }

    /**
     * @notice SME creates a delivery parcel and deposits the payment into escrow.
     * @param _receiver Wallet address of the delivery recipient.
     * @param _ipfsHash Pinata CID storing package metadata.
     */
    function createParcel(address _receiver, string memory _ipfsHash) external payable {
        require(msg.value > 0, "Escrow payment must be greater than zero");
        require(_receiver != address(0), "Invalid receiver address");

        parcelCount++;
        parcels[parcelCount] = Parcel({
            id: parcelCount,
            sme: payable(msg.sender),
            courier: payable(address(0)),
            receiver: _receiver,
            escrowAmount: msg.value,
            ipfsHash: _ipfsHash,
            status: DeliveryStatus.Created,
            isCompleted: false
        });

        emit ParcelCreated(parcelCount, msg.sender, _receiver, msg.value, _ipfsHash);
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

        parcel.courier = payable(msg.sender);
        parcel.status = DeliveryStatus.PickedUp;

        emit ParcelPickedUp(_id, msg.sender);
    }

    /**
     * @notice Receiver validates proof of delivery, releasing locked escrow funds to the courier.
     * @param _id Parcel ID.
     */
    function confirmDelivery(uint256 _id) external onlyReceiver(_id) {
        Parcel storage parcel = parcels[_id];
        require(parcel.status == DeliveryStatus.PickedUp, "Parcel not picked up yet");
        require(!parcel.isCompleted, "Escrow already released");

        parcel.status = DeliveryStatus.Delivered;
        parcel.isCompleted = true;

        uint256 payout = parcel.escrowAmount;
        parcel.courier.transfer(payout);

        emit DeliveryConfirmed(_id, parcel.courier, payout);
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
}