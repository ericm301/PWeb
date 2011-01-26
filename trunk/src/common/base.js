/**
 * Copyright 2010 by Anadan. All rights reserved.
 * @author Anadan (aaafwd@gmail.com)
 */

/**
 * @define {boolean}
 */
var G_DEBUG = false;

var pweb = pweb || {};

/**
 * @typedef {{
 *            attribute: string,
 *            tags: string,
 *            value: string,
 *            valueRegex: string
 *          }}
 */
pweb.Filter;

/**
 * @typedef {{
 *            name: string,
 *            urlRegex: string,
 *            urlExcludeRegex: string,
 *            enabled: boolean,
 *            preserveDocWrite: boolean,
 *            css: string,
 *            html: string,
 *            js: string,
 *            filters: Array.<!pweb.Filter>
 *          }}
 */
pweb.Rule;

/**
 * @typedef {{
 *            pwebProviderRules: !Array.<!pweb.Rule>,
 *            pwebProviderLastUpate: number,
 *            pwebProviderVersion: string
 *          }}
 */
pweb.RuleSet;

/**
 * @typedef {{
 *            enabled: boolean
 *          }}
 */
pweb.ProviderInfo;
