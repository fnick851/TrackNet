var active_categories = [
    { value: 'Advertisement', data: '30%', enabled: false },
    { value: 'Marketing', data: '19%', enabled: false },
    { value: 'Web Clients', data: '12%', enabled: false },
    { value: 'Video', data: '8%', enabled: false },
  ];

  var other_categories = [{ value: 'API', data: '15%', enabled: false },
    { value: 'Suspicious', data: '12%', enabled: false },
    { value: 'Content Servers', data: '12%', enabled: false },
    { value: 'Web Analysis', data: '8%', enabled: false },
    { value: 'Social Networking', data: '5%', enabled: false },];

$(function () {
    // setup autocomplete function pulling from categories[] array
    $('#autocomplete').autocomplete({
        minLength: 0,
        lookup: other_categories,
        onSelect: function (item) {
            var html = '<div class="active_category_item">' +
            '<button class="delete_item" onclick="remove_active_item(this);"></button>' +
            '<span class="item_name">' + item.value + '</span> <span class="separator">|</span> ' +
            '<i><span class="item_percent">' + item.data + '</span></i>' +
            '<input type="checkbox">' +
        '</div>';

            $('#active_categories').append(html);
            document.getElementById('autocomplete').value = '';

            for (var i = 0; i < other_categories.length; i++) {
                if (other_categories[i].value == item.value)
                    other_categories.splice(i, 1);
            }

            active_categories.push(item);
            $(document).trigger('click');
        }
    });
});

function pop_to_top(category_item)
{
    
}

function remove_active_item(remove_item)
{
    var item_value = $(remove_item).next().html();
    var item;
    $(remove_item).parent().remove();
    

    for (var i = 0; i < active_categories.length; i++) 
    {
        if (active_categories[i].value == item_value) 
        {
            item = active_categories[i];
            active_categories.splice(i, 1);
        }
    }

    other_categories.push(item);
}

$(document).ready(function(){
    //TODO:
    //could be changed to get the top 5 categories from other_categories lists, move them to active_categories
    for(var i = 0; i < active_categories.length; i++)
    {
        var html = '<div class="active_category_item">' +
                '<button class="delete_item" onclick="remove_active_item(this);"></button>' +
                '<span class="item_name">' + active_categories[i].value + '</span> <span class="separator">|</span> ' +
                '<i><span class="item_percent">' + active_categories[i].data + '</span></i>' +
                '<input type="checkbox">' +
            '</div>';
            
            $('#active_categories').append(html);
    }
});