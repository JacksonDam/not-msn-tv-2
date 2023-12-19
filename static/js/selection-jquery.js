var layer = -1;
var height= -1;
var posInHeight = -1;
var selected;
var selectionContainer = {};
var focusBox;
var lastLayer = -1;
var lastHeight = -1;
var lastPosInHeight = -1;
function updateSelection(){
    if (selected) {
        var elementRect = selected.getBoundingClientRect();
        var boxMargin = 4;
        var top = elementRect.top - boxMargin;
        var left = elementRect.left - boxMargin;
        var width = elementRect.width + 2 * boxMargin;
        var height = elementRect.height + 2 * boxMargin;
        focusBox.css("top", top + 'px');
        focusBox.css("left", left + 'px');
        focusBox.css("width", width + 'px');
        focusBox.css("height", height + 'px');
    }
}

function tempHideFocusBox() {
    focusBox.addClass("hide-focus");
    setTimeout(function() {
        focusBox.removeClass("hide-focus");
    }, 250);
}

function setLast() {
    lastLayer = layer;
    lastHeight = height;
    lastPosInHeight = posInHeight;
}

function goToLast() {
    goToSpecific(lastLayer, lastHeight, lastPosInHeight);
}

function goToLayer(newLayer) {
    layer = newLayer;
    height = 0;
    posInHeight = 0;
    selected = selectionContainer[layer][height][posInHeight];
    updateSelection();
}

function goToSpecific(newLayer, newHeight, newPosInHeight) {
    layer = newLayer;
    height = newHeight;
    posInHeight = newPosInHeight;
    selected = selectionContainer[layer][height][posInHeight];
    updateSelection();
}

$(document).ready(function() {
    $('#scrollbar').css('display', 'block');
    $('body').css('overflow', 'hidden');
    const selectSound = $('#select-sound').get(0);
    const controlFeedback = $('#control-feedback-sound').get(0);
    focusBox = $("#focus-box");
    var selectables = $('.selectable');
    $.each(selectables, function(name, val) {
        var itemLayer = parseInt($(val).attr("select-layer"));
        var itemHeight = parseInt($(val).attr("select-height"));
        if (!(itemLayer in selectionContainer)) {
            selectionContainer[itemLayer] = {};
        }
        var curLayer = selectionContainer[itemLayer];
        if (!(itemHeight in curLayer)) {
            curLayer[itemHeight] = [];
        }
        curLayer[itemHeight].push(val);
    });
    if (0 in selectionContainer && !(selectionContainer[0].length === 0)) {
        selected = selectionContainer[0][0][0];
        layer = 0;
        height = 0;
        posInHeight = 0;
        updateSelection(selected);
    }
    $(document).keydown(function(e) {
        console.log(e.which);
        if (e.which == 13) {
            if ($(selected).hasClass("custom-checkbox")) {
                controlFeedback.currentTime = 0;
                controlFeedback.play();
            }
            else {
                selectSound.currentTime = 0;
                selectSound.play();
            }
            focusBox.addClass("green-border");
            setTimeout(function() {
                focusBox.removeClass("green-border");
                selected.click();
            }, 100);
        }
        else if (e.which == 37) {
            if (posInHeight > 0) {
                posInHeight--;
            }
        }
        else if (e.which == 39) {
            if (posInHeight + 1 < selectionContainer[layer][height].length) {
                posInHeight++;
            }
        }
        else if (e.which == 38) {
            if (height > 0) {
                height--;
                posInHeight = 0;
            }
        }
        else if (e.which == 40) {
            if (height + 1 < Object.keys(selectionContainer[layer]).length) {
                height++;
                posInHeight = 0;
            }
        }
        console.log(height + " " + posInHeight);
        selected = selectionContainer[layer][height][posInHeight];
        updateSelection(selected);
    });
    $(window).on( "resize", function() {
        updateSelection(selected);
    } );
});