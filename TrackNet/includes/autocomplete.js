var active_categories = [];

  var other_categories = [];

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


function activate_3p_cat_tab()
{
    $('#category_selector_tab_3p').attr('aria-expanded', 'true');
    $('#category_selector_tab_3p').attr('aria-selected', 'true');
    $('#category_selector_tab_3p').addClass('ui-state-active');
    $('#category_selector_tab_3p').addClass('ui-tabs-active');

    $('#website_selector_tab_3p').attr('aria-expanded', 'false');
    $('#website_selector_tab_3p').attr('aria-selected', 'false');
    $('#website_selector_tab_3p').removeClass('ui-tabs-active');
    $('#website_selector_tab_3p').removeClass('ui-state-active');
}

function activate_3p_web_tab()
{
    $('#category_selector_tab_3p').attr('aria-expanded', 'false');
    $('#category_selector_tab_3p').attr('aria-selected', 'false');
    $('#category_selector_tab_3p').removeClass('ui-state-active');
    $('#category_selector_tab_3p').removeClass('ui-tabs-active');

    $('#website_selector_tab_3p').attr('aria-expanded', 'true');
    $('#website_selector_tab_3p').attr('aria-selected', 'true');
    $('#website_selector_tab_3p').addClass('ui-tabs-active');
    $('#website_selector_tab_3p').addClass('ui-state-active');
}

function activate_1p_cat_tab()
{
    $('#category_selector_tab_1p').attr('aria-expanded', 'true');
    $('#category_selector_tab_1p').attr('aria-selected', 'true');
    $('#category_selector_tab_1p').addClass('ui-state-active');
    $('#category_selector_tab_1p').addClass('ui-tabs-active');

    $('#website_selector_tab_1p').attr('aria-expanded', 'false');
    $('#website_selector_tab_1p').attr('aria-selected', 'false');
    $('#website_selector_tab_1p').removeClass('ui-tabs-active');
    $('#website_selector_tab_1p').removeClass('ui-state-active');
}

function activate_1p_web_tab()
{
    $('#category_selector_tab_1p').attr('aria-expanded', 'false');
    $('#category_selector_tab_1p').attr('aria-selected', 'false');
    $('#category_selector_tab_1p').removeClass('ui-state-active');
    $('#category_selector_tab_1p').removeClass('ui-tabs-active');

    $('#website_selector_tab_1p').attr('aria-expanded', 'true');
    $('#website_selector_tab_1p').attr('aria-selected', 'true');
    $('#website_selector_tab_1p').addClass('ui-tabs-active');
    $('#website_selector_tab_1p').addClass('ui-state-active');
}
