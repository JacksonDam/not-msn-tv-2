var layer = -1;
var height= -1;
var posInHeight = -1;
var selected;
var selectionContainer = {};
var focusBox;
var lastLayer = -1;
var lastHeight = -1;
var lastPosInHeight = -1;
var selectables;
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

function hideFocusBox() {
    focusBox.addClass("hide-focus");
}

function unHideFocusBox() {
    focusBox.removeClass("hide-focus");
    updateSelection();
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
    updateSelection(selected);
}

function goToSpecific(newLayer, newHeight, newPosInHeight) {
    layer = newLayer;
    height = newHeight;
    posInHeight = newPosInHeight;
    selected = selectionContainer[layer][height][posInHeight];
    updateSelection(selected);
}

function initialiseSelectables(divObj) {
    console.log("INIT");
    layer = -1;
    height = -1;
    posInHeight = -1;
    selected;
    selectionContainer = {};
    lastLayer = -1;
    lastHeight = -1;
    lastPosInHeight = -1;
    selectables = divObj.find('.selectable');
    console.log(selectables);
    $.each(selectables, function(name, val) {
        console.log(val);
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
        console.log("GOOD");
        selected = selectionContainer[0][0][0];
        layer = 0;
        height = 0;
        posInHeight = 0;
        updateSelection(selected);
    }
}

$(document).ready(function() {
    $('#scrollbar').css('display', 'block');
    $('body').css('overflow', 'hidden');
    const selectSound = $('#select-sound').get(0);
    const controlFeedback = $('#control-feedback-sound').get(0);
    focusBox = $("#focus-box");
    initialiseSelectables($('#main-page'));
    $("#start-btn").on( "click", function(e) {
        selectSound.currentTime = 0;
        selectSound.play();
        $(e.target).animate({ opacity: 0 }, { duration: 200, queue: false });
        $(e.target).animate({ "font-size": "200px" }, { duration: 300, queue: false });
        setTimeout(function() {
            $(e.target).remove();
            start();
        }, 500)
    });
    $(document).keydown(function(e) {
        const pressed = e.code;
        if (pressed === 'Tab') {
            e.preventDefault();
            return;
        }
        else if (pressed === 'Enter') {
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
            return;
        }
        else if (pressed === 'ArrowLeft') {
            if (posInHeight > 0) {
                posInHeight--;
            }
        }
        else if (pressed === 'ArrowRight') {
            if (posInHeight + 1 < selectionContainer[layer][height].length) {
                posInHeight++;
            }
        }
        else if (pressed === 'ArrowUp') {
            if (height > 0) {
                height--;
                posInHeight = 0;
            }
        }
        else if (pressed === 'ArrowDown') {
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
    });
});