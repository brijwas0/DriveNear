/* DriveNear — js/data/mockData.js
   Catalogue data container. All hardcoded demo cars have been removed.
   Only real listings added by users or loaded from Firebase appear here.
*/

const IMG = [];
const AVA = [];

const OWNER_NAMES = [];

function mkOwner(i){
  return {
    name: 'Verified Host',
    avatar: '',
    rating: '5.0',
    trips: 0,
    idVerified: true,
    phoneVerified: true,
    response: 100
  };
}

const CAR_DEFS = [];

let CARS = [];

const CONVERSATIONS = [];

const NOTIFICATIONS = [
  { icon: '🚗', text: 'Welcome to DriveNear! Explore verified cars or list your own car.', time: 'Just now' }
];
