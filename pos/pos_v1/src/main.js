(function(window) {

function formatStr(str, data) {
    return str.replace(TEMPLATE_DEFINITION, function($0, $1) {
        return data[$1] || $0;
    })
}

/**
 * format the currency
 */
function formatCurrency(price) {
    return Math.floor(price) + '.' +(price * 100).toString().substr(-2); 
}

var PromotionPolicy = {
    "NORMAL": function() {},
    "BUY_TWO_GET_ONE_FREE": function(good) {
        good.freeCount = Math.floor(good.count / 3);
    }
}

var TEMPLATE_DEFINITION = /\{\{([^\}]*)\}\}/g;
var GOOD_TEMPLATE       = '名称：{{name}}，数量：{{amount}}，单价：{{formattedPrice}}(元)，小计：{{subTotal}}(元)';
var PROMOTION_TEMPLATE  = '名称：{{name}}，数量：{{amount}}';
var RECEIPT_TEMPLATE    = '***<没钱赚商店>购物清单***\n' +
                        '{{payList}}\n' +
                        '----------------------\n' +
                        '挥泪赠送商品：\n' +
                        '{{freeList}}\n' +
                        '----------------------\n' +
                        '总计：{{total}}(元)' + '\n' +
                        '节省：{{saved}}(元)' + '\n' +
                        '**********************'

/**
 * fetch the detail
 */
function getGoodDetail(code) {
    var items = loadAllItems(),
        result, i, item;

    for(i=0; i<items.length; i++) {
        item = items[i];
        if(item.barcode == code) {
            result = item;
            break;
        }
    }

    return result;
}

/**
 * parse the list
 */
function getDetailedList(goodArr) {
    var goodList = {},
        promoteType, good, code, count, i;

    for(i = 0; i < goodArr.length; i++) {
        good = /^(\w{10})-?(\d*)/.exec(goodArr[i]);
        code = good[1];
        count = parseInt(good[2], 10) || 1;

        if(!goodList[code]) {
            detail = getGoodDetail(code);
            promoteType = getPromoteTypes(code);

            goodList[code] = {
                'count'    : 0,
                'name'     : detail.name,
                'unit'     : detail.unit,
                'price'    : detail.price,
                'freeCount': 0,
                'promote'  : PromotionPolicy[promoteType],
                'formattedPrice'   : formatCurrency(detail.price)
            };
        }

        goodList[code]['count'] += count;
    }

    return goodList;
}

function getPromoteTypes(code) {
    var promotions = loadPromotions(),
        i, result = 'NORMAL';

    for(i=0; i<promotions.length; i++) {
        if(promotions[i]['barcodes'].indexOf(code) > -1) {
            result = promotions[i]['type'];
            break;
        }
    }

    return result;
}

/**
 * calc promote
 */
function calcPromote(list) {
    var code, item, i;

    for(code in list) {
        item = list[code];
        item.promote(item);
        item.actualCount = item.count - item.freeCount;
    }

    return list;
}

/**
 * render for output
 */
function renderList(rawList) {
    var payList = [],
        freeList = [],
        total = save = 0,
        code, item, price;

    for(code in rawList) {
        item = rawList[code];
        if(item.actualCount > 0) {
            subtotal = item.price * item.actualCount;

            payList.push(formatStr(GOOD_TEMPLATE, {
                name     : item.name,
                amount   : item.count + item.unit,
                formattedPrice   : item.formattedPrice,
                subTotal : formatCurrency(subtotal)
            }));

            total += subtotal;
        }

        if(item.freeCount > 0) {
            save += item.price * item.freeCount;
            
            freeList.push(formatStr(PROMOTION_TEMPLATE, {
                name: item.name, amount: item.freeCount + item.unit
            }));
        }
    }

    return formatStr(RECEIPT_TEMPLATE, {
                payList : payList.join('\n'),
                freeList: freeList.join('\n'),
                total   : formatCurrency(total),
                saved   : formatCurrency(save)
            })
}

/**
 * main
 */
function printInventory(arr) {
    var rawList = getDetailedList(arr);
    var newList = calcPromote(rawList);
    var displaylist = renderList(rawList);
    console.log(displaylist);
}

window.printInventory = printInventory;

})(window)
