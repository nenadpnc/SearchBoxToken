(function(){
    var categoryList = [
        {
            name: 'in',
            url: 'data/places.json'
        },
        {
            name: 'landform',
            url: 'data/landform.json'
        },
        {
            name: 'temperature',
            url: 'data/temperature.json'
        },
        {
            name: 'where I can',
            url: 'data/todo.json',
            multiple: true
        },
        {
            name: 'related to',
            url: 'data/related.json'
        }
    ];
    
    var searchBox = $('#search_box').tokenInput(
        categoryList,
        {
            theme: 'facebook',
            hintText: 'in <span>France</span>, landform <span>coast</span>, temperature <span>mild</span>, where I can <span>visit museums + go out</span><br> temperature <span>hot</span>, where I can <span>eat gourmet food</span>, related to <span>Harry Potter</span><br> where I can <span>do wine tasting</span>, in <span>Tuscany</span>, temperature <span>hot</span>',
            spinner: $('.spinner')
        }
    );
    
    $('.search-btn-container').on('click', function(){
        var tokens = searchBox.tokenInput('get');
        var message = 'You selected: ';
        for(var i = 0; i < tokens.length; i++){
            message += tokens[i].category.name + ': ' + tokens[i].name + ', ';
        }
        alert(message);
    });
    
    
})();