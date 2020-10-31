# ecb-exchange-rates

Node.js API for accessing exchange rates from the European Central
Bank public API
([https://sdw-wsrest.ecb.europa.eu/help/](https://sdw-wsrest.ecb.europa.eu/help/)).
Please configure your firewall to allow connections over https to
https://sdw-wsrest.ecb.europa.eu if necessary

I am not affiliated with the ECB, this software is provided as is. Please be
considerate when accessing ECB resources and try to cache as much as
possible. Please check out the help page above if you're going to use this is production.

## Installation

```bash
npm i -S ecb-exchange-rates
```

## Usage

```bash
import EuropeanCentralBankExchangeRates from 'ecb-exchange-rates'

const ecb = new EuropeanCentralBankExchangeRates()

const options = { 
  startPeriod: new Date('2000'), 
  endPeriod: new Date('2001'), 
  interval: 'M' 
}

(async () => {
  const result = await ecb.exchangeRate(options)
  console.log(result)
})()

```

## Class: EuropeanCentralBankExchangeRates

### constructor

#### endpoint

• `Optional` **endpoint**: undefined \| string

___

#### maxCacheEntries

• `Optional` **maxCacheEntries**: undefined \| number

___

#### maxCacheSize

defaults to 100

• `Optional` **maxCacheSize**: undefined \| number

___

#### maxResponseSize

defaults to 2 mb

• `Optional` **maxResponseSize**: undefined \| number

___

#### requestTimeout

defaults to 20 seconds

• `Optional` **requestTimeout**: undefined \| number

## Methods

### destroy

▸ **destroy**(): void

**Returns:** void

___

### exchangeRate

▸ **exchangeRate**(`options`: IOptions): Promise\<IOutput>

#### Parameters:

Name | Type |
------ | ------ |
`options` | IOptions |

##### endPeriod

•  **endPeriod**: Date

___

##### fromCurrency

defaults to 'EUR'

• `Optional` **fromCurrency**: Currency

___

##### interval

defaults to 'M'

• `Optional` **interval**: \"M\" \| \"D\"

___

##### maxByteSize

•  **maxByteSize**: number

___

##### maxSize

•  **maxSize**: number

___

##### startPeriod

•  **startPeriod**: Date

___

##### toCurrency

defaults to all

• `Optional` **toCurrency**

___

##### type

defaults to A

• `Optional` **type**: undefined \| string

___

##### variationCode

defaults to SP00

• `Optional` **variationCode**: undefined \| string


**Returns:** Promise\<IOutput>

## Interface IOutput

### data

•  **data**: IDatum

___

### meta

•  **meta**: IMeta

## Interface: IDatum

### collection

•  **collection**: string

___

### compilation

• `Optional` **compilation**: undefined \| string

___

### decimals

•  **decimals**: string

___

### items

•  **items**: IItem
___

### sourceAgency

•  **sourceAgency**: string

___

### timeFormat

•  **timeFormat**: string

___

### title

•  **title**: string

___

### titleCompl

•  **titleCompl**: string

___

### unit

•  **unit**: string

___

### unitMult

•  **unitMult**: string


## IItem

### period

•  **period**: string

___

### value

•  **value**: number

