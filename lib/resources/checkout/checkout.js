'use strict';

const Bigcommerce = require('lib/bigcommerce.js');
const baseCartPath = '/v3/carts';
const baseCheckoutPath = '/v3/checkouts';


class Checkout extends Bigcommerce{
  /***
    *
    * Carts
    *
   ***/

  /** Get an individual cart, by ID. Params passed in optionally such as {include: 'redirect_urls'} */
  async getCart(cartId, params) {
    return Bigcommerce.get(`${baseCartPath}/{${cartId}`, params);
  }

  /* Get an individual cart together with option selections. Optional additional params. */
  async getCartWithOptionSelections(cartId, params) {
    return this.getCart(cartId, {
      ...params,
      ...{include:[
          'line_items.physical_items.options',
          'line_items.digital_items.options'
        ]}
    })
  }

  /** Get an individual cart together with redirect URLs. Optional additional params. */
  async getCartWithRedirectURLs(cartId, params) {
    return this.getCart(cartId, {
      ...params,
      ...{include:[
          'redirect_urls'
        ]}
    })
  }

  /** Generate Redirect URLs for a cart, by cart ID. */
  async generateCartRedirectURLs(cartId) {
    return Bigcommerce.post(`${baseCartPath}/{${cartId}/redirect_urls`, {});
  }

  /** Update the Customer ID on a particular cart, which will
   * recalculate cart pricing and discounts for that customer. */
  async updateCartCustomerId(cartId, customerId, params) {
    return Bigcommerce.put(`${baseCartPath}/{${cartId}`, { customer_id: customerId }, params);
  }

  /** Create a new cart by supply a cart object. Optional params. */
  async createCart(cartId, data, params) {
    return Bigcommerce.post(`${baseCartPath}/{${cartId}`, data, params);
  }

  /** Create a cart while also generating redirect URLs which will be returned in the response.
   * Optional additional params. */
  async createCartWithRedirectURLs(cartId, data, params) {
    return this.createCart(cartId, data, {
      ...params,
      ...{include:[
          'redirect_urls'
        ]}
    })
  }

  /** Add additional line items to an existing cart. */
  async addLineItemsToCart(cartId, data, params) {
    return Bigcommerce.post(`${baseCartPath}/{${cartId}/items`, data, params);
  }

  /** Update an existing line item on an existing cart. */
  async updateCartLineItem(cartId, itemId, data, params) {
    return Bigcommerce.put(`${baseCartPath}/{${cartId}/items/${itemId}`, data, params);
  }

  /** Remove a line item from an existing cart.
   * Removing the last line item will have the effect of removing the cart. */
  async removeLineItemFromCart(cartId, itemId, params) {
    return Bigcommerce.delete(`${baseCartPath}/{${cartId}/items/${itemId}`, params);
  }

  /***
   *
   * Checkouts
   *
   ***/

  /** Get an individual checkout, by ID. Params passed in optionally
   * such as {include: 'consignments.available_shipping_options'} */
  async getCheckout(checkoutId, params) {
    return Bigcommerce.get(`${baseCheckoutPath}/{${cartId}`, params);
  }

  /** Get an individual checkout together with redirect URLs. Optional additional params. */
  async getCheckoutWithOptionSelections(cartId, params) {
    return this.getCheckout(checkoutId, {
      ...params,
      ...{include:[
          'line_items.physical_items.options',
          'line_items.digital_items.options'
        ]}
    })
  }

  /** Get an individual checkout together with available shipping options.
   * Optional additional params. */
  async getCheckoutWithShippingOptions(cartId, params) {
    return this.getCheckout(checkoutId, {
      ...params,
      ...{include:[
          'consignments.available_shipping_options'
        ]}
    })
  }

  /** Add a billing address to an existing checkout */
  async addCheckoutBillingAddress(checkoutId, data, params) {
    return Bigcommerce.post(`${baseCheckoutPath}/{${cartId}/billing-address`, data, params);
  }

  /** Update the billing address on an existing checkout */
  async updateCheckoutBillingAddress(checkoutId, addressId, data, params) {
    return Bigcommerce.put(
      `${baseCheckoutPath}/{${cartId}/billing-address/${addressId}`,
      data,
      params
    );
  }

  /** Add consigments on an existing checkout */
  async addConsignmentsToCheckout(checkoutId, data, params) {
    return Bigcommerce.post(`${baseCheckoutPath}/{${cartId}/consignments`, data, params);
  }

  /** Update an existing consigment on an existing checkout */
  async updateCheckoutConsigment(checkoutId, consignmentId, data, params) {
    return Bigcommerce.put(
      `${baseCheckoutPath}/{${cartId}/consignments/${consignmentId}`,
      data,
      params
    );
  }

  /** Delete a checkout consignment on an existing checkout */
  async deleteCheckoutConsigment(checkoutId, consignmentId, params) {
    return Bigcommerce.delete(
      `${baseCheckoutPath}/{${cartId}/consignments/${consignmentId}`,
      data,
      params
    );
  }

  /** Add coupon to checkout */
  async addCheckoutCoupon(checkoutId, couponCode, params) {
    return Bigcommerce.post(
      `${baseCheckoutPath}/{${cartId}/coupons`,
      { coupon_code: couponCode },
      params
    );
  }

  /** Remove coupon from checkout */
  async deleteCheckoutCoupon(checkoutId, couponCode, params) {
    return Bigcommerce.delete(
      `${baseCheckoutPath}/{${cartId}/coupons/${couponCode}`,
      params
    );
  }

  /** Convert a checkout to an order to make it ready for payment. */
  async convertCheckoutToOrder(checkoutId, params) {
    return Bigcommerce.post(
      `${baseCheckoutPath}/{${cartId}/orders`,
      params
    );
  }

  /** Get the appropriate type of redirect URL for a Cart or Checkout, wrapped in a
   * Customer Login API JWT to log the customer in if necessary
   * Valid urlType values are: 'cart_url', 'checkout_url', 'embedded_checkout_url'
   */
  async getCheckoutRedirectWithLogin(
    checkoutId,
    urlType,
    customerLoginJwtOptions = {}
  ) {
    const validUrlTypes = [
      'cart_url',
      'checkout_url',
      'embedded_checkout_url'
    ];

    if (!validUrlTypes.includes(url)) {
      new Error(`Invalid urlType on getLoginUrlWithCheckoutRedirect. Type must be one of: ${validUrlType
        .map(t => ` '${t}'`)}`); // Nicer error formatting
    }

    // Get cart & URLs from API
    const cartData = await this.getCartWithRedirectURLs(cartId)['data'];

    // Fetch the requested URL (cart/checkout/embedded checkout)
    const redirectUrl = new URL(cartData['redirect_urls'][urlType]);
    // Fetch channel ID for the JWT
    const channelId = cartData['channel_id'];
    // Fetch customer ID for the JWT
    const customerId = cartData['customer_id'];

    // If the cart belongs to a customer, wrap it in a customer login JWT
    if (customerId > 0) {
      const jwt = Bigcommerce.createCustomerLoginJWT(customerId, channelId, {
          ...customerLoginJwtOptions,
          ...{ redirectUrl: redirectUrl.pathname + redirectUrl.search }
        }
      );
      redirectUrl.href = redirectUrl.origin + '/login/token/' + jwt;
    }

    return redirectUrl.href;
  }
}
