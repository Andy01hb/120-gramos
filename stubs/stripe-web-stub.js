// Stub for @stripe/stripe-react-native on web — payment is mobile-only
const noop = () => Promise.resolve({});

exports.StripeProvider = ({ children }) => children;
exports.usePaymentSheet = () => ({
  initPaymentSheet: noop,
  presentPaymentSheet: noop,
  resetPaymentSheetCustomer: noop,
});
