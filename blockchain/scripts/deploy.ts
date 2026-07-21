import { network } from "hardhat";

async function main() {
  const { viem, networkName } = await network.create();

  console.log(`Deploying DeliveryEscrow to ${networkName}...`);

  const deliveryEscrow = await viem.deployContract("DeliveryEscrow");

  console.log("✅ DeliveryEscrow deployed successfully!");
  console.log("📍 Contract Address:", deliveryEscrow.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});