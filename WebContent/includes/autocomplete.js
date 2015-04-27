var domains = [
    { value: 'google.com' },
    { value: 'cmu.edu'},
    { value: 'yahoo.com'},
    { value: 'nytimes.com'},
    { value: 'facebook.com'},
    { value: 'twitter.com'},
    { value: 'instagram.com'},
    { value: 'vine.co'},
    { value: 'mail.google.com'},
    { value: 'mail.yahoo.com'},
    { value: 'umd.edu'},
    { value: 'bestbuy.com'},
    { value: 'apple.com'},
    { value: 'ebay.com'},
    { value: 'amazon.com'},
    { value: 'linkedin.com'},
    { value: 'piazza.com'},
    { value: 'last.fm'},
    { value: 'spotify.com'}
  ];

$(function () {
    // setup autocomplete function pulling from categories[] array
    $('#autocomplete').autocomplete({
        minLength: 0,
        lookup: domains,
        onSelect: function (item) {
            
            //
            // Show stuff for the selected first-party site
            //

            $(document).trigger('click');
        }
    });
});
