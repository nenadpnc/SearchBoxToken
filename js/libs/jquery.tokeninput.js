/*
 * jQuery Plugin: Tokenizing Autocomplete Text Entry
 * Version 1.6.0
 *
 * Copyright (c) 2009 James Smith (http://loopj.com)
 * Licensed jointly under the GPL and MIT licenses,
 * choose which one suits your project best!
 *
 */

(function ($) {
// Default settings
var DEFAULT_SETTINGS = {
	// Search settings
    method: "GET",
    contentType: "json",
    queryParam: "q",
    searchDelay: 300,
    minChars: 1,
    propertyToSearch: "name",
    jsonContainer: null,
    categoryList: null,
    isCategorySearch: true,
    categoryData: {},
    multipleCategoryData: [],
    spinner: null,
    tokensToBeSelected: false,
    selectedMultipleTokens: [],

	// Display settings
    hintText: "Type in a search term",
    noResultsText: "No results",
    searchingText: "Searching...",
    deleteText: "&times;",
    animateDropdown: false,

	// Tokenization settings
    tokenLimit: null,
    tokenDelimiter: ",",
    preventDuplicates: false,

	// Output settings
    tokenValue: "id",

	// Prepopulation settings
    prePopulate: null,
    processPrePopulate: false,

	// Manipulation settings
    idPrefix: "token-input-",

	// Formatters
    resultsFormatter: function(item, category, multiple){ 
        if(typeof item === "object"){ 
            if(typeof category === "undefined"){
                return '<li>' + item[this.propertyToSearch] + '</li>';
            }else{ 
                if(multiple){
                    return '<li><strong>' + category + '</strong>' + item[this.propertyToSearch] + '<span> + </span></li>';
                }else{
                    return '<li><strong>' + category + '</strong>' + item[this.propertyToSearch] + '</li>';
                }
            }
             
        }else{ 
            if(typeof category === 'undefined'){
                return '<li>' + item + '</li>';
            }else{ 
                if(multiple){
                    return '<li><strong>' + category.name + ' </strong>' + item + '<span> + </span></li>';
                }else{
                    return '<li><strong>' + category.name + ' </strong>' + item + '</li>';
                }
            }
            
        }
    },
    tokenFormatter: function(item) { 
        if(typeof item === "object"){
            return "<li><p>" + item[this.propertyToSearch] + "</p></li>"; 
        }else{
            return "<li><p>" + item + "</p></li>";
        }
        
    },
    multipleTokenFormatter: function(item){
        return "<li><p>" + item + " +</p></li>";
    },

	// Callbacks
    onResult: null,
    onAdd: null,
    onDelete: null,
    onReady: null
};

// Default classes to use when theming
var DEFAULT_CLASSES = {
    tokenList: "token-input-list",
    token: "token-input-token",
    tokenDelete: "token-input-delete-token",
    selectedToken: "token-input-selected-token",
    highlightedToken: "token-input-highlighted-token",
    dropdown: "token-input-dropdown",
    dropdownItem: "token-input-dropdown-item",
    dropdownItem2: "token-input-dropdown-item2",
    selectedDropdownItem: "token-input-selected-dropdown-item",
    inputToken: "token-input-input-token",
    catToken: "token-input-cat"
};

// Input box position "enum"
var POSITION = {
    BEFORE: 0,
    AFTER: 1,
    END: 2
};

// Keys "enum"
var KEY = {
    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    ESCAPE: 27,
    SPACE: 32,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    END: 35,
    HOME: 36,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    NUMPAD_ENTER: 108,
    COMMA: 188
};

// Additional public (exposed) methods
var methods = {
    init: function(url_or_data_or_function, options) {
        var settings = $.extend({}, DEFAULT_SETTINGS, options || {});

        return this.each(function () {
            $(this).data("tokenInputObject", new $.TokenList(this, url_or_data_or_function, settings));
        });
    },
    clear: function() {
        this.data("tokenInputObject").clear();
        return this;
    },
    add: function(item) {
        this.data("tokenInputObject").add(item);
        return this;
    },
    remove: function(item) {
        this.data("tokenInputObject").remove(item);
        return this;
    },
    get: function() {
    	return this.data("tokenInputObject").getTokens();
   	}
}

// Expose the .tokenInput function to jQuery as a plugin
$.fn.tokenInput = function (method) {
    // Method calling and initialization logic
    if(methods[method]) {
        return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else {
        return methods.init.apply(this, arguments);
    }
};

// TokenList class for each input
$.TokenList = function (input, data, settings) {
    //
    // Initialization
    //

    // Set the local data to search through
    settings.categoryList = data;
    var arr = [];

    for(var i = 0; i < data.length; i++){
        arr.push(data[i][settings.propertyToSearch]);
        if(data[i].multiple){
            settings['categoryMultiple'] = data[i];
        }
    }
    // Build class names
    if(settings.classes) {
        // Use custom class names
        settings.classes = $.extend({}, DEFAULT_CLASSES, settings.classes);
    } else if(settings.theme) {
        // Use theme-suffixed default class names
        settings.classes = {};
        $.each(DEFAULT_CLASSES, function(key, value) {
            settings.classes[key] = value + "-" + settings.theme;
        });
    } else {
        settings.classes = DEFAULT_CLASSES;
    }

    // Save the tokens
    var saved_tokens = [];

    // Keep track of the number of tokens in the list
    var token_count = 0;

    // Basic cache to save on db hits
    var cache = new $.TokenList.Cache();

    // Keep track of the timeout, old vals
    var timeout;
    var input_val;

    // Create a new text input an attach keyup events
    var input_box = $("<input type=\"text\"  autocomplete=\"off\">")
        .css({
            outline: "none"
        })
        .attr("id", settings.idPrefix + input.id)
        .focus(function () {
            if (settings.tokenLimit === null || settings.tokenLimit !== token_count) { 
                if(input_token.prev().length < 1){
                    show_dropdown_hint();
                }else{ 
                    var prev_token = input_token.prev().data('tokeninput');
                    if(settings.isCategorySearch){
                        populate_dropdown("", settings.categoryList);
                    }else if(prev_token && prev_token.multiple){
                        populate_dropdown("", settings.multipleCategoryData, settings.categoryMultiple);
                    }else{
                        searchByCategory("", prev_token);
                    }
                }
            }
        })
        .blur(function () {
            hide_dropdown();
        })
        .bind("keyup keydown blur update", resize_input)
        .keydown(function (event) {
            var previous_token;
            var next_token;

            switch(event.keyCode) {
                case KEY.LEFT:
                case KEY.RIGHT:
                case KEY.UP:
                case KEY.DOWN:
                    var dropdown_item = null;

                    if(event.keyCode === KEY.DOWN || event.keyCode === KEY.RIGHT) {
                        dropdown_item = $(selected_dropdown_item).next();
                    } else {
                        dropdown_item = $(selected_dropdown_item).prev();
                    }

                    if(dropdown_item.length) {
                        select_dropdown_item(dropdown_item);
                    }
                    return false;
                    break;

                case KEY.BACKSPACE:
                    previous_token = input_token.prev();
                    var prev_data = previous_token.data('tokeninput');

                    if(!$(this).val().length) { 
                        if(previous_token.length > 0){
                           delete_token($(previous_token.get(0))); 
                        }
                        settings.tokensToBeSelected = false;
                        return false;
                    } else if($(this).val().length === 1) {
                        hide_dropdown();
                        settings.tokensToBeSelected = false;
                    } else if(prev_data && prev_data.multiple){ 
                        var text = $(this).val().split(' + ');
                        var query = text[text.length - 1].split('');
                        query.splice(query.length - 1, 1);
                        var newQuery = query.join('');
                        if(settings.selectedMultipleTokens[settings.selectedMultipleTokens.length - 1] === newQuery || newQuery === ''){
                            var item = settings.selectedMultipleTokens.splice(settings.selectedMultipleTokens.length - 1, 1);
                            if(settings.selectedMultipleTokens.length === 0){
                                $(this).val(settings.selectedMultipleTokens.join(' + '));
                            }else{
                                $(this).val(settings.selectedMultipleTokens.join(' + ') + ' + ');
                            }

                            settings.multipleCategoryData.push(item[0]);
                            populate_dropdown('', settings.multipleCategoryData, prev_data); 
                            settings.tokensToBeSelected = true;
                            return false;
                        }else{ 
                            var results = $.grep(settings.multipleCategoryData, function(val){
                                return val.toLowerCase().indexOf(newQuery.toLowerCase()) > -1;
                            });
                            populate_dropdown(newQuery, results, prev_data);
                        }
                        
                    } else {
                        // set a timeout just long enough to let this function finish.
                        settings.tokensToBeSelected = false;
                        setTimeout(function(){do_search();}, 5);
                    }
                    break;

                case KEY.TAB:
                case KEY.ENTER:
                case KEY.NUMPAD_ENTER:
                  if(selected_dropdown_item) { 
                    handleSelectItem($(selected_dropdown_item).data("tokeninput"));
                  }
                  return false;
                  break;
                
                case KEY.SPACE:
                    var previous_token = input_token.prev().data('tokeninput');
                    if(settings.tokensToBeSelected){ 
                        if(previous_token.multiple){
                            var text = input_box.val().split(' + ');
                            var query = text[text.length - 1];
                            if(settings.selectedMultipleTokens[settings.selectedMultipleTokens.length - 1] === query || query === ''){
                                addMultipleTokens();
                            }
                            settings.isCategorySearch = true;
                            return false;
                        }else{
                            add_token($(this).val(), false);
                            settings.isCategorySearch = true;
                            hidden_input.change();
                            return false;
                        }
                    }
                    break;

                case KEY.ESCAPE:
                  hide_dropdown();
                  return true;

                default:
                    if(String.fromCharCode(event.which)) {
                        var prev_data = input_box.prev().data('tokeninput');
                        if(prev_data && prev_data.multiple){
                            settings.tokensToBeSelected = true;
                        }else{
                            settings.tokensToBeSelected = false;
                        }
                        setTimeout(function(){do_search();}, 5);
                    }
                    break;
            }
        });

    // Keep a reference to the original input box
    var hidden_input = $(input)
                           .hide()
                           .val("")
                           .focus(function () {
                               input_box.focus();
                           })
                           .blur(function () {
                               input_box.blur();
                           });

    // Keep a reference to the selected token and dropdown item
    var selected_token = null;
    var selected_token_index = 0;
    var selected_dropdown_item = null;

    // The list to store the token items in
    var token_list = $("<ul />")
        .addClass(settings.classes.tokenList)
        .insertBefore(hidden_input)
        .click(function(){
            input_box.focus();
        });

    // The token holding the input box
    var input_token = $("<li />")
        .addClass(settings.classes.inputToken)
        .appendTo(token_list)
        .append(input_box);

    // The list to store the dropdown items in
    var dropdown = $("<div>")
        .addClass(settings.classes.dropdown)
        .appendTo("body")
        .hide();

    // Magic element to help us resize the text input
    var input_resizer = $("<tester/>")
        .insertAfter(input_box)
        .css({
            position: "absolute",
            top: -9999,
            left: -9999,
            width: "auto",
            fontSize: input_box.css("fontSize"),
            fontFamily: input_box.css("fontFamily"),
            fontWeight: input_box.css("fontWeight"),
            letterSpacing: input_box.css("letterSpacing"),
            whiteSpace: "nowrap"
        });

    // Pre-populate list if items exist
    hidden_input.val("");
    var li_data = settings.prePopulate || hidden_input.data("pre");
    if(settings.processPrePopulate && $.isFunction(settings.onResult)) {
        li_data = settings.onResult.call(hidden_input, li_data);
    }
    if(li_data && li_data.length) {
        $.each(li_data, function (index, value) {
            insert_token(value);
            checkTokenLimit();
        });
    }

    // Initialization is done
    if($.isFunction(settings.onReady)) {
        settings.onReady.call();
    }

    //
    // Public functions
    //

    this.clear = function() {
        token_list.children("li").each(function() {
            if ($(this).children("input").length === 0) {
                delete_token($(this));
            }
        });
    }

    this.add = function(item) {
        add_token(item);
    }

    this.remove = function(item) {
        token_list.children("li").each(function() {
            if ($(this).children("input").length === 0) {
                var currToken = $(this).data("tokeninput");
                var match = true;
                for (var prop in item) {
                    if (item[prop] !== currToken[prop]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    delete_token($(this));
                }
            }
        });
    }
    
    this.getTokens = function() {
   		return saved_tokens;
   	}

    //
    // Private functions
    //

    function checkTokenLimit() {
        if(settings.tokenLimit !== null && token_count >= settings.tokenLimit) {
            input_box.hide();
            hide_dropdown();
            return;
        }
    }

    function resize_input() {
        if(input_val === (input_val = input_box.val())) {return;}

        // Enter new content into resizer and resize input accordingly
        var escaped = input_val.replace(/&/g, '&amp;').replace(/\s/g,' ').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        input_resizer.html(escaped);
        input_box.width(input_resizer.width() + 30);
        show_dropdown();
    }
    
    function insert_category_token(item){ 
        if(typeof item === 'undefined') return;
        var token = settings.tokenFormatter(item);
        token = $(token).addClass('' + settings.classes.token + ' ' + settings.classes.catToken).insertBefore(input_token);
        
        item["isCategory"] = true;
        $.data(token.get(0), "tokeninput", item);
        
        searchByCategory("", item);
    }

    // Inner function to a token to the list
    function insert_token(item, isCategorySearch) { 
        if(typeof item === 'undefined') return;
        
        var category = input_token.prev().data('tokeninput');
        input_token.prev().remove();
        
        var this_token = settings.tokenFormatter(item);
        this_token = $(this_token).addClass(settings.classes.token).insertBefore(input_token);
        
        // The 'delete token' button
        $("<span>" + settings.deleteText + "</span>")
            .addClass(settings.classes.tokenDelete)
            .appendTo(this_token)
            .click(function () {
                delete_token($(this).parent());
                hidden_input.change();
                return false;
            });

        // Store data on the token
        var token_data = {name: item, category: category};
        $.data(this_token.get(0), "tokeninput", token_data);

        // Save this token for duplicate checking
        saved_tokens = saved_tokens.slice(0,selected_token_index).concat([token_data]).concat(saved_tokens.slice(selected_token_index));
        selected_token_index++;

        // Update the hidden input
        update_hidden_input(saved_tokens, hidden_input);

        token_count += 1;

        // Check the token limit
        /*if(settings.tokenLimit !== null && token_count >= settings.tokenLimit) {
            input_box.hide();
            hide_dropdown();
        }*/
        
        for(var i = 0; i < settings.categoryList.length; i++){
            if(settings.categoryList[i].name === category.name){ 
                settings.categoryList.splice(i, 1);
                break;
            }
        } 
        populate_dropdown("", settings.categoryList);

        return this_token;
    }
    
    function addMultipleTokens(){
        var category = input_token.prev().data('tokeninput');
        input_token.prev().remove();
        input_box.val('');
        
        for(var i = 0; i < settings.selectedMultipleTokens.length; i++){
            var item = settings.selectedMultipleTokens[i];
            var this_token = settings.tokenFormatter(item);
            this_token = $(this_token).addClass(settings.classes.token).insertBefore(input_token);

            // The 'delete token' button
            $("<span>" + settings.deleteText + "</span>")
                .addClass(settings.classes.tokenDelete)
                .appendTo(this_token)
                .click(function () {
                    delete_token($(this).parent());
                    hidden_input.change();
                    return false;
                });

            // Store data on the token
            var token_data = {name: item, category: category};
            $.data(this_token.get(0), "tokeninput", token_data);

            // Save this token for duplicate checking
            saved_tokens = saved_tokens.slice(0,selected_token_index).concat([token_data]).concat(saved_tokens.slice(selected_token_index));
            selected_token_index++;

            // Update the hidden input
            update_hidden_input(saved_tokens, hidden_input);

            token_count += 1;
            settings.multipleCategoryData.push(item);
        }
        settings.selectedMultipleTokens = [];
        settings.tokensToBeSelected = false;
        
        for(var i = 0; i < settings.categoryList.length; i++){
            if(settings.categoryList[i].name === category.name){ 
                settings.categoryList.splice(i, 1);
                break;
            }
        } 
        resize_input();
        populate_dropdown("", settings.categoryList);
    };
    
    function insertMultipleToken(item){ 
        if(typeof item === 'undefined') return;
        var prev_data = input_token.prev().data('tokeninput');
        
        for(var i = 0; i < settings.multipleCategoryData.length; i++){
            if(settings.multipleCategoryData[i] === item){
                settings.multipleCategoryData.splice(i, 1);
                break;
            }
        }
        
        settings.selectedMultipleTokens.push(item);
        input_box.val(settings.selectedMultipleTokens.join(' + ') + ' + ');
        settings.tokensToBeSelected = true;
        
        populate_dropdown('', settings.multipleCategoryData, prev_data);
    };
    
    function handleSelectItem(item){ 
        if(!item) return;
        if(settings.isCategorySearch){
            add_token(item, true);
            settings.isCategorySearch = false;
            hidden_input.change();
            settings.tokensToBeSelected = false;
        }else if(input_token.prev().data('tokeninput').multiple){
            insertMultipleToken(item);
        }else{
            input_box.val(item);
            settings.tokensToBeSelected = true;
        }
    };

    // Add a token to the token list based on user input
    function add_token (item, isCategorySearch) {
        var callback = settings.onAdd;
        
        // Insert the new tokens
        if(settings.tokenLimit == null || token_count < settings.tokenLimit) { 
            if(isCategorySearch){
                insert_category_token(item);
            }else{
                insert_token(item); 
            }
            checkTokenLimit();
        }

        // Clear input box
        input_box.val("");
        
        // Execute the onAdd callback if defined
        if($.isFunction(callback)) {
            callback.call(hidden_input,item);
        }
    }

    // Delete a token from the token list
    function delete_token (token) {
        // Remove the id from the saved list
        var token_data = $.data(token.get(0), "tokeninput");
        var callback = settings.onDelete;

        var index = token.prevAll().length;
        if(index > selected_token_index) index--;
        
        settings.isCategorySearch = true;

        // Delete the token
        token.remove();
        selected_token = null;
 
        if(!token_data.isCategory){
            // Remove this token from the saved list
            saved_tokens = saved_tokens.slice(0,index).concat(saved_tokens.slice(index+1));
            if(index < selected_token_index) selected_token_index--;

            // Update the hidden input
            update_hidden_input(saved_tokens, hidden_input);

            token_count -= 1;

            /*if(settings.tokenLimit !== null) {
                input_box
                    .show()
                    .val("")
                    .focus();
            }*/
            if(token_data.category.multiple){ 
                var pom = false;
                for(var i = 0; i < saved_tokens.length; i++){
                    if(saved_tokens[i].category.multiple){
                        pom = true;
                        break;
                    }
                }
                if(!pom){
                    settings.categoryList.push(token_data.category);
                }
            }else{
                settings.categoryList.push(token_data.category);
            }
            
        }
        // Show the input box and give it focus again
        input_box.focus();

        // Execute the onDelete callback if defined
        if($.isFunction(callback)) {
            callback.call(hidden_input,token_data);
        }
    }

    // Update the hidden input box value
    function update_hidden_input(saved_tokens, hidden_input) {
        var token_values = $.map(saved_tokens, function (el) {
            return el[settings.tokenValue];
        });
        hidden_input.val(token_values.join(settings.tokenDelimiter));

    }

    // Hide and clear the results dropdown
    function hide_dropdown () {
        dropdown.hide().empty();
        selected_dropdown_item = null;
    }

    function show_dropdown() {
        dropdown
            .css({
                position: "absolute",
                top: $(token_list).offset().top + $(token_list).outerHeight(),
                left: $(token_list).offset().left,
                width: token_list.width(),
                zindex: 999
            })
            .show();
    }

    function show_dropdown_searching () {
        if(settings.searchingText) {
            dropdown.html("<p>"+settings.searchingText+"</p>");
            show_dropdown();
        }
    }

    function show_dropdown_hint () {
        if(settings.hintText) {
            dropdown.html("<p>"+settings.hintText+"</p>");
            show_dropdown();
        }
    }

    // Highlight the query part of the search term
    function highlight_term(value, term) { 
        if(!value) return;
        return value.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + term + ")(?![^<>]*>)(?![^&;]+;)", "gi"), "<b>$1</b>");
    }
    
    function find_value_and_highlight_term(template, value, term) {
        return template.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + value + ")(?![^<>]*>)(?![^&;]+;)", "g"), highlight_term(value, term));
    }

    // Populate the results dropdown with some results
    function populate_dropdown (query, results, category) {
        if(results && results.length) {
            dropdown.empty();
            var dropdown_ul = $("<ul>")
                .appendTo(dropdown)
                .mouseover(function (event) {
                    select_dropdown_item($(event.target).closest("li"));
                })
                .mousedown(function (event) { 
                    handleSelectItem($(event.target).closest("li").data("tokeninput"));
                    resize_input();
                    return false;
                })
                .hide();

            $.each(results, function(index, value) {
                var this_li = settings.resultsFormatter(value, category, category && category.multiple ? true : false);
                
                this_li = find_value_and_highlight_term(this_li ,typeof value === "object" ? value[settings.propertyToSearch] : value, query);            
                
                this_li = $(this_li).appendTo(dropdown_ul);
                
                if(index % 2) {
                    this_li.addClass(settings.classes.dropdownItem);
                } else {
                    this_li.addClass(settings.classes.dropdownItem2);
                }

                if(index === 0) {
                    select_dropdown_item(this_li);
                }

                $.data(this_li.get(0), "tokeninput", value);
            });

            show_dropdown();

            if(settings.animateDropdown) {
                dropdown_ul.slideDown("fast");
            } else {
                dropdown_ul.show();
            }
        } else {
            if(settings.noResultsText) {
                dropdown.html("<p>"+settings.noResultsText+"</p>");
                show_dropdown();
            }
        }
    }

    // Highlight an item in the results dropdown
    function select_dropdown_item (item) {
        if(item) {
            if(selected_dropdown_item) {
                deselect_dropdown_item($(selected_dropdown_item));
            }

            item.addClass(settings.classes.selectedDropdownItem);
            selected_dropdown_item = item.get(0);
        }
    }

    // Remove highlighting from an item in the results dropdown
    function deselect_dropdown_item (item) {
        item.removeClass(settings.classes.selectedDropdownItem);
        selected_dropdown_item = null;
    }

    // Do a search and show the "searching" dropdown if the input is longer
    // than settings.minChars
    function do_search() {
        var query = input_box.val().toLowerCase();

        if(query && query.length) {
            

            if(query.length >= settings.minChars) {
                show_dropdown_searching();
                var prev_token = input_token.prev().data('tokeninput');
                if(settings.isCategorySearch){ 
                    for(var i = 0; i < settings.categoryList.length; i++){
                        if(query.toLowerCase() === settings.categoryList[i][settings.propertyToSearch].toLowerCase()){
                            add_token(settings.categoryList[i], true);
                            settings.isCategorySearch = false;
                            hidden_input.change();
                            return;
                        }
                    }
                    
                    var results = $.grep(settings.categoryList, function (val) {
                        return val[settings.propertyToSearch].toLowerCase().indexOf(query) > -1;
                    });
                    populate_dropdown(query, results);
                }else if(prev_token && prev_token.multiple){ 
                    var arr = query.split(' + ');
                    var newQuery = arr[arr.length - 1];
                    var results = $.grep(settings.multipleCategoryData, function (val) {
                        return val.toLowerCase().indexOf(newQuery) > -1;
                    });
                    populate_dropdown(newQuery, results, settings.categoryMultiple);
                }else{
                    searchByCategory(query, input_token.prev().data('tokeninput'));
                }

            } else {
                hide_dropdown();
            }
        }
    }
    
    function searchByCategory(query, category){
        
        if(typeof settings.categoryData[category.name] === 'undefined'){ 
            settings.spinner.removeClass('hide');
            $.ajax({
                url: category.url,
                dataType: 'text',
                success: function(data){ 
                    var json = typeof data === 'string' ? JSON.parse(data) : data;

                    var results = $.grep(json, function(val){
                        return val.toLowerCase().indexOf(query.toLowerCase()) > -1;
                    });
                    settings.categoryData[category.name] = json;
                    
                    if(category.multiple){
                        settings.multipleCategoryData = json;
                    }
                    
                    populate_dropdown(query, results, category);
                    settings.spinner.addClass('hide');
                }   
            });
        }else{ 
            var dataList = category.multiple ? settings.multipleCategoryData : settings.categoryData[category.name];
            var results = $.grep(dataList, function(val){
                return val.toLowerCase().indexOf(query.toLowerCase()) > -1;
            });
            populate_dropdown(query, results, category);
        }
    }
    
};

// Really basic cache for the results
$.TokenList.Cache = function (options) {
    var settings = $.extend({
        max_size: 500
    }, options);

    var data = {};
    var size = 0;

    var flush = function () {
        data = {};
        size = 0;
    };

    this.add = function (query, results) {
        if(size > settings.max_size) {
            flush();
        }

        if(!data[query]) {
            size += 1;
        }

        data[query] = results;
    };

    this.get = function (query) {
        return data[query];
    };
};
}(jQuery));
