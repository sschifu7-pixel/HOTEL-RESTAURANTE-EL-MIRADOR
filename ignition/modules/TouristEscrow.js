import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TouristEscrowModule", (m) => {
  const restaurantAddress = m.getAccount(0);
  const escrow = m.contract("TouristEscrow", [restaurantAddress]);
  return { escrow };
});
