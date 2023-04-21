import crypto from 'crypto-js'
  /**
   * API for Shopier payment service
   * @class 
   * @classdesc You can get payments with this package
   * @module Shopier
   * 
   */  
  
export default class Shopier {
   
  paymentUrl = 'https://www.shopier.com/ShowProduct/api_pay4.php'
  buyer = {}
  moduleVersion = '1.0.4'

  constructor(apiKey,apiSecret, currency) {
    this.apiKey = apiKey;
    
    this.apiSecret = apiSecret;
    
    this.currency = currency;
  }

  /**
   * 
   * @example
   * 
   * shopier.setBuyer({
      id: '010101',
      product_name: 'Balance',
      first_name: 'Fatih',
      last_name: 'Akdoğan',
      email: 'mail@mail.com',
      phone: '05555555555'
    });
   * 
   * @description Set the buyer's information.
   * 
   */
  setBuyer(fields) {
    this.#buyerValidateAndLoad(this.#buyerFields(), fields)
  }

  /**
   * 
   * @example
   * 
   * shopier.setOrderBilling({
      billing_address: 'Kennedy Caddesi No:2592',
      billing_city: 'Istanbul',
      billing_country: 'Türkiye',
      billing_postcode: '34000'
    });
   * 
   * @description Set buyer's billing address.
   */

   
  setOrderBilling(fields) {
    this.#buyerValidateAndLoad(this.#orderBillingFields(), fields)
  }

  /**
   * @example
   * shopier.setOrderShipping({
      shipping_address: 'Kennedy Caddesi No:2592',
      shipping_city: 'Istanbul',
      shipping_country: 'Türkiye',
      shipping_postcode: '34000'
    });
   * @description Set buyer's shipping address.
   */ 
  setOrderShipping(fields) {
    this.#buyerValidateAndLoad(this.#orderShippingFields(), fields)
  }

  #buyerValidateAndLoad(validationFields, fields) {
    Object.keys(validationFields).some(key => {
      if (validationFields[key] && !fields[key]) {
        throw new Error(`${key} is required`)
      }
      this.buyer[key] = fields[key]
    })
  }

  #buyerFields() {
    return {
      id: true,
      product_name: true,
      first_name: true,
      last_name: true,
      email: true,
      phone: true
    }
  }

  #orderBillingFields() {
    return {
      billing_address: true,
      billing_city: true,
      billing_country: true,
      billing_postcode: true
    }
  }
  #orderShippingFields() {
    return {
      shipping_address: true,
      shipping_city: true,
      shipping_country: true,
      shipping_postcode: true
    }
  }
  
  #generateFormObject(amount) {
    Object.keys(this.#buyerFields()).forEach(key => {
      if (!this.buyer[key]) {
        throw new Error(`${key} is required`)
      }
    })

    Object.keys(this.#orderShippingFields()).forEach(key => {
      if (!this.buyer[key]) {
        throw new Error(`${key} is required`)
      }
    })

    Object.keys(this.#orderBillingFields()).forEach(key => {
      if (!this.buyer[key]) {
        throw new Error(`${key} is required`)
      }
    })

    const args = {
      API_key: this.apiKey,
      website_index: 1,
      platform_order_id: this.buyer.id,
      product_name: this.buyer.product_name,
      product_type: 0, //1 : downloadable-virtual 0:real object,2:default
      buyer_name: this.buyer.first_name,
      buyer_surname: this.buyer.last_name,
      buyer_email: this.buyer.email,
      buyer_account_age: 0,
      buyer_id_nr: this.buyer.id,
      buyer_phone: this.buyer.phone,
      billing_address: this.buyer.billing_address,
      billing_city: this.buyer.billing_city,
      billing_country: this.buyer.billing_country,
      billing_postcode: this.buyer.billing_postcode,
      shipping_address: this.buyer.shipping_address,
      shipping_city: this.buyer.shipping_city,
      shipping_country: this.buyer.shipping_country,
      shipping_postcode: this.buyer.shipping_postcode,
      total_order_value: amount,
      currency: this.#getCurrency(),
      platform: 0,
      is_in_frame: 0,
      current_language: this.#lang(),
      modul_version: this.moduleVersion,
      random_nr: Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000
    }
    const data = args.random_nr + args.platform_order_id + args.total_order_value + args.currency
    const signature = crypto.HmacSHA256(data, this.apiSecret)
    const signatureBase64 = crypto.enc.Base64.stringify(signature)
    args.signature = signatureBase64
    return args
  }

  #recursiveHtmlStringGenerator(args) {
    let html = ''
    Object.keys(args).forEach(key => {
      html += `<input type="hidden" name="${key}" value="${args[key]}">`
    })
    return html
  }

  #generateForm(amount) {
    const obj = this.#generateFormObject(amount)
    return this.#recursiveHtmlStringGenerator(obj)
  }

  /**
   * 
   * @param {Number} amount 
   * @returns This will return the purchase form as html.
   * 
   * @example
   * const paymentPage = shopier.payment(15) // For 15₺/$/€
   * 
   */

  payment(amount) {
    const form = this.#generateForm(amount)
    return `<!doctype html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport"
    content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title></title>
    </head>
    <form id="shopier_payment_form" method="post" action="${this.paymentUrl}">
    ${form}
    </form>
    <body>
    <script type="text/javascript">
    document.getElementById("shopier_payment_form").submit();
		</script>
    </body>
    </html>`
  }

  #getCurrency() {
    return this.currency;
  }

  #lang() {
    const current_language = 'tr-TR'
    let current_lan = 1
    if (current_language == 'tr-TR') {
      current_lan = 0
    }
    return current_lan
  }

  /**
   * 
   * @param {String} body 
   * @returns `{ order_id: 10592, payment_id: 413449826, installment: 0 }`
   * 
   * @example
   * 
   * app.post('/shopier-notify', (req, res) => {
   *    const callback = shopier.callback(req.body)
   * })
   */
  callback(body) {
    const data = body.random_nr + body.platform_order_id
    const signature = crypto.enc.Base64.parse(body.signature).toString()
    const expected = crypto.HmacSHA256(data, this.apiSecret).toString()
    if (signature === expected) {
      if (body.status == 'success') {
        return {
          success: true,
          order_id: body.platform_order_id,
          payment_id: body.payment_id,
          installment: body.installment
        }
      } else {
        return { success: false, message: "Payment not completed successfuly." };
      }
    } else {
      throw new Error('Signature is not valid.')
    }
  }
}

