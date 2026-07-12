import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TouristEscrowModule", (m) => {
  const restaurantAddress = m.getAccount(1);
  const escrow = m.contract("TouristEscrow", [restaurantAddress]);
  return { escrow };
});
