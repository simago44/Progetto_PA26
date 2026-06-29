import { User } from "./User.ts";
import { Bid } from "./Bid.ts";
import { Auction } from "./Auction.ts";

// Define all associations here, remove them from individual model files
User.hasMany(Bid, {
  sourceKey: "id",
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
  as: "bids",
});
Auction.hasMany(Bid, {
  sourceKey: "id",
  foreignKey: {
    name: "auctionId",
    allowNull: false,
  },
  as: "bids",
});
Bid.belongsTo(User, {
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
});
Bid.belongsTo(Auction, {
  foreignKey: {
    name: "auctionId",
    allowNull: false,
  },
});
Auction.belongsTo(User, {
  foreignKey: {
    name: "creatorId",
    allowNull: false,
  },
});
Auction.belongsTo(User, {
  foreignKey: {
    name: "winnerId",
  },
});

export { User, Bid, Auction };
