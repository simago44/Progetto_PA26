import { User } from './User.ts';
import { Bid } from './Bid.ts';
import { Auction } from './Auction.ts';

// Define all associations here, remove them from individual model files
User.hasMany(Bid, { sourceKey: 'id', foreignKey: 'userId', as: 'bids' });
Auction.hasMany(Bid, { sourceKey: 'id', foreignKey: 'auctionId', as: 'bids' });
Bid.belongsTo(User, { foreignKey: 'userId' });
Bid.belongsTo(Auction, { foreignKey: 'auctionId' });

export { User, Bid, Auction };