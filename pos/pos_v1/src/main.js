(function(window) {
/**
 * fetch the detail
 */
function getDetail(code) {
    var items = loadAllItems(),
        result;

    for(var i=0; i<items.length; i++) {
        var item = items[i];
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
function parseList(arr) {
    var rawList = {},
        good, code, count, i;

    for(i = 0; i < arr.length; i++) {
        good = /^(\w{10})-?(\d*)/.exec(arr[i]);
        code = good[1];
        count = parseInt(good[2]) || 1;
        rawList[code] = rawList[code] || 0;
        rawList[code] += count;
    }

    for(item in rawList) {
        var detail = getDetail(item);
        var count = rawList[item];
        detail.count = count;
        rawList[item] = detail;
    }
    
    return rawList;
}

/**
 * calc discount
 */
function promote(list) {
    var promotions = loadPromotions();
    var type, barcodes, code, item, i;

    for(i=0; i<promotions.length; i++) {
        type = promotions[i]['type'];
        barcodes = promotions[i]['barcodes'];

        for(code in list) {
            item = list[code];
            item.freeCount = 0;
            item.actualCount = item.count;
            
            if('BUY_TWO_GET_ONE_FREE' == type) {
                if(~barcodes.indexOf(code)) {
                    item = list[code];
                    item.freeCount = Math.floor(item.count / 3);
                }
                item.actualCount = item.count - item.freeCount;                                         
            }
            item.formattedPrice = formatCurrency(item.price);
        }
    }

    return list;
}



/**
 * format the currency
 */
function formatCurrency(price) {
    return Math.floor(price) + '.' +(price * 100).toString().substr(-2); 
}

/**
 * format output
 */
function processList(rawList) {
    var result = '***<没钱赚商店>购物清单***',
        payList = [],
        freeList = [],
        total = save = 0,
        code, item, price;

    for(code in rawList) {
        item = rawList[code];
        if(item.actualCount > 0) {
            price = item.price * item.actualCount;
            payList.push('名称：' + item.name + '，' +
                         '数量：' + item.count + item.unit + '，' + 
                         '单价：' + item.formattedPrice + '(元)，' + 
                         '小计：' + formatCurrency(price) + '(元)');
            total += price;
        }

        if(item.freeCount > 0) {
            save += item.price * item.freeCount;
            freeList.push('名称：' + item.name + '，' +
                          '数量：' + item.freeCount + item.unit);
        }
    }

    return result + '\n' +
            payList.join('\n') + '\n' +
            '----------------------' + '\n' +
            '挥泪赠送商品：' + '\n' +
            freeList.join('\n') + '\n' +
            '----------------------\n' +
            '总计：' + formatCurrency(total) +'(元)' + '\n' +
            '节省：' + formatCurrency(save)  + '(元)' + '\n' +
            '**********************'
}

/**
 * main
 */
function printInventory(arr) {
    var rawList = parseList(arr);
    var newList = promote(rawList);
    var displaylist = processList(rawList);
    console.log(displaylist);
}

window.printInventory = printInventory;
})(window)
