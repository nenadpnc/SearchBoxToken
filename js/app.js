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
    
    $('#search_box').tokenInput(
        categoryList,
        {
            theme: 'facebook',
            hintText: 'in <span>France</span>, landform <span>coast</span>, temperature <span>mild</span>, where I can <span>visit museums + go out</span><br> temperature <span>hot</span>, where I can <span>eat gourmet food</span>, related to <span>Harry Potter</span><br> where I can <span>do wine tasting</span>, in <span>Tuscany</span>, temperature <span>hot</span>',
            preventDuplicates: true,
            categoryList: categoryList,
            spinner: $('.spinner')
        }
    )
})();