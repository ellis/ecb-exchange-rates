import debugFactory from "debug";
import { camelCase, lowerCase, memoize } from "lodash";
import fetch from "node-fetch";
import { performance } from "perf_hooks";
import prettyBytes from "pretty-bytes";
import querystring from "querystring";
import { URL } from "url";
import { DOMParser } from "xmldom";

import Cache from "./cache";

export type Currency = "EUR" |
  "USD" |
  "JPY" |
  "BGN" |
  "CZK" |
  "DKK" |
  "GBP" |
  "HUF" |
  "PLN" |
  "RON" |
  "SEK" |
  "CHF" |
  "ISK" |
  "NOK" |
  "HRK" |
  "RUB" |
  "TRY" |
  "AUD" |
  "BRL" |
  "CAD" |
  "CNY" |
  "HKD" |
  "IDR" |
  "ILS" |
  "INR" |
  "KRW" |
  "MXN" |
  "MYR" |
  "NZD" |
  "PHP" |
  "SGD" |
  "THB" |
  "ZAR";

export interface IOutput {
  data: IDatum[];
  meta: IMeta;
}

export interface IDatum {
    timeFormat: string;
    sourceAgency: string;
    unitMult: string;
    title: string;
    titleCompl: string;
    collection: string;
    unit: string;
    decimals: string;
    items: IItem[];
    compilation?: string;
}

export interface IItem {
    period: string;
    value: number;
}

export interface IMeta {
    url: string;
}

export interface IOptions {
  startPeriod: Date;
  endPeriod: Date;
  interval?: "M" | "D";
  fromCurrency?: Currency | "";
  toCurrency?: Currency | "";
  type?: string;
  variationCode?: string;
}

export interface IEuropeanCentralBankExchangeRatesContructorOptions {
  endpoint?: string;
  maxCacheEntries?: number;
  maxCacheSize?: number;
  requestTimeout?: number;
  maxResponseSize?: number;
}

const HOUR = 1000 * 60 * 60;

const debug = debugFactory("ecb");

const parser = new DOMParser();

const defaultOptions = {
  fromCurrency: "EUR",
  interval: "M",
  toCurrency: "",
  type: "SP00",
  variationCode: "A",
};

// Documentation
// https://sdw-wsrest.ecb.europa.eu/help/

function formatDate(date: Date) {
  const d = new Date(date);
  let month = "" + (d.getUTCMonth() + 1);
  let day = "" + d.getUTCDate();
  const year = d.getUTCFullYear();

  if (month.length < 2) {
    month = "0" + month;
  }
  if (day.length < 2) {
    day = "0" + day;
  }

  return [year, month, day].join("-");
}

class EuropeanCentralBankExchangeRates {
  private endpoint: string;
  private requestTimeout: number;
  private maxResponseSize: number;
  private interval: ReturnType<typeof setTimeout>;

  private fetchUrl = memoize(async (url: string) => {
    debug("fetching", url);
    const t0 = performance.now();
    const response = await fetch(url, { timeout: this.requestTimeout, size: this.maxResponseSize });
    if (!response.ok) { throw await response.text(); }
    const buffer = await response.buffer();
    const xml = buffer.toString();
    const t1 = performance.now();
    debug(`download exchange rates (${prettyBytes(buffer.length)}), finished in ${Math.floor(t1 - t0)} milliseconds`);
    if (xml.trim() === "") {
      debug(`result set is empty...`);
      return JSON.stringify({
        data: [],
        meta: {
          url,
        },
      });
    }
    debug(`processing result set...`);
    const data = parser.parseFromString(xml, "text/xml");
    const series = data.getElementsByTagName("generic:Series");
    const result = new Array(series.length);
    for (let i = 0; i < series.length; i++) {
      const seriesItem = series[i];
      const elements = seriesItem.getElementsByTagName("generic:Obs");
      const items = new Array(elements.length);
      for (let j = 0; j < elements.length; j++) {
        const element = elements[j];
        const valueElements = element.getElementsByTagName("generic.Value");
        const otherAttributes: { [key: string]: string | undefined } = {};
        // tslint:disable-next-line: prefer-for-of
        for (let k = 0; k < valueElements.length; k++) {
          const valueElement = valueElements[k];
          const id = valueElement.getAttribute("id");
          if (!id) { continue; }
          const key = camelCase(lowerCase(id));
          const value = valueElement.getAttribute("value");
          if (!value) { continue; }
          otherAttributes[key] = value;
        }
        items[j] = {
          ...otherAttributes,
          period: element.getElementsByTagName("generic:ObsDimension")[0].getAttribute("value"),
          value: parseFloat(element ?.getElementsByTagName("generic:ObsValue")[0].getAttribute("value") || ""),
        };
      }
      const attributes: { [key: string]: string | undefined } = {};
      const headerElements = seriesItem
        .getElementsByTagName("generic:Attributes")[0]
        .getElementsByTagName("generic:Value");
      // tslint:disable-next-line: prefer-for-of
      for (let j = 0; j < headerElements.length; j++) {
        const element = headerElements[j];
        const id = element.getAttribute("id");
        if (!id) { continue; }
        const key = camelCase(lowerCase(id));
        const value = element.getAttribute("value");
        if (!value) { continue; }
        attributes[key] = value;
      }
      result[i] = {
        ...attributes,
        items,
      };
    }
    debug(`done processing result set!`);

    return JSON.stringify({
      data: result,
      meta: {
        url,
      },
    });
  });

  constructor(options: IEuropeanCentralBankExchangeRatesContructorOptions = {}) {
    this.endpoint = options.endpoint || "https://sdw-wsrest.ecb.europa.eu/service/data/EXR/";
    this.requestTimeout = options.requestTimeout || 20000;

    this.maxResponseSize = options.maxResponseSize || 1024 * 1024 * 2;
    this.fetchUrl.cache = new Cache({
      maxByteSize: options.maxCacheSize || 1024 * 1024 * 20,
      maxSize: options.maxCacheEntries || 100,
    });
    this.interval = setInterval(() => {
      (this.fetchUrl.cache as Map<string, string>).clear();
    }, HOUR);
  }

  public destroy() {
    clearInterval(this.interval);
  }

  public async exchangeRate(options: IOptions) {
    const {
      startPeriod,
      endPeriod,
      interval,
      toCurrency,
      fromCurrency,
      type,
      variationCode,
    } = { ...defaultOptions, ...options };

    const qs = querystring.stringify({ startPeriod: formatDate(startPeriod), endPeriod: formatDate(endPeriod) });
    const key = [interval, toCurrency, fromCurrency, type, variationCode].join(".");
    const { href: url } = new URL(`${key}?${qs}`, this.endpoint);
    const json = await this.fetchUrl(url);
    return JSON.parse(json) as IOutput;
  }
}

export default EuropeanCentralBankExchangeRates;
