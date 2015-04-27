(function() {


    var width, height, largeHeader, top,source,currentContainer, canvas, ctx, points,position, target, animateHeader = true;
    var expectedArray  = ['large-header','large-header1', 'large-header2'];
    var containerArray = [];
    getEligibleObject();
  $(window).resize(function(){
    getEligibleObject();
  });
    // Main
    if(containerArray.length > 0){
        initHeader(containerArray[0],source);
        initAnimation();
        addListeners();
    }

    function getEligibleObject(){
        if($("#"+expectedArray[0]).length == 1){
             var eligible = {};
             eligible['div_id']    = 'large-header';
             eligible['canvas_id'] = 'demo-canvas';
             position              = 'top';
             source                = 1;
             eligible              = setProp(eligible, source)
             containerArray.push(eligible);
        }
       if($("#"+expectedArray[1]).length == 1){
         	
             var eligible = {};
             eligible['div_id']    = 'large-header1';
             eligible['canvas_id'] = 'demo-canvas1';
             if(containerArray.length > 0 ){
                position = 'both';
                source   = 2;
             }else{
                position = 'bottom';
                source   = 2;
             }
             eligible              = setProp(eligible, 2)
             containerArray.push(eligible);
        }
        if($("#"+expectedArray[2]).length == 1){
         	
             var eligible = {};
             eligible['div_id']    = 'large-header2';
             eligible['canvas_id'] = 'demo-canvas2';
             if(containerArray.length > 0 ){
                position = 'both';
                source   = 3;
             }else{
                position = 'bottom';
                source   = 3;
             }
             eligible              = setProp(eligible, 3)
             containerArray.push(eligible);
        }
      
        
    }
   
    function setProp(eligibleObj, source){
        var offset          = $("#"+eligibleObj['div_id']).offset();
       //console.log(offset);
        eligibleObj['top']  = offset.top;
        var width           = $("#"+eligibleObj['div_id']).width();
        var height          = 0;
        if(source == 2 || source == 3){
           height = $("#"+eligibleObj['div_id']).outerHeight();
        }else{
           height = $("#"+eligibleObj['div_id']).height();
        }
        var canvasObj    = document.getElementById(eligibleObj['canvas_id']);
        canvasObj.width  = width;
        canvasObj.height = height;
        eligibleObj['canvas'] = canvasObj;
        eligibleObj['height'] = height;
        eligibleObj['width']  = width;
        if(eligibleObj['canvas_id'] == 'demo-canvas1') {
          canvasObj.style.visibility = 'hidden';
          //eligibleObj['visibility']  = 'hidden';
        }
      	if(eligibleObj['canvas_id'] == 'demo-canvas2') {
          canvasObj.style.visibility = 'hidden';
          //eligibleObj['visibility']  = 'hidden';
        }
          // create points
        var points = [];
        for(var x = 0; x < width; x = x + width/16) {
            for(var y = 0; y < height; y = y + height/16) {
                var px = x + Math.random()*width/16;
                var py = y + Math.random()*height/16;
                var p = {x: px, originX: px, y: py, originY: py };
                points.push(p);
            }
        }

        // for each point find the 5 closest points
        for(var i = 0; i < points.length; i++) {
            var closest = [];
            var p1 = points[i];
            for(var j = 0; j < points.length; j++) {
                var p2 = points[j]
                if(!(p1 == p2)) {
                    var placed = false;
                    for(var k = 0; k < 5; k++) {
                        if(!placed) {
                            if(closest[k] == undefined) {
                                closest[k] = p2;
                                placed = true;
                            }
                        }
                    }

                    for(var k = 0; k < 5; k++) {
                        if(!placed) {
                            if(getDistance(p1, p2) < getDistance(p1, closest[k])) {
                                closest[k] = p2;
                                placed = true;
                            }
                        }
                    }
                }
            }
            p1.closest = closest;
        }

        // assign a circle to each point
        for(var i in points) {
            var c = new Circle(points[i], 2+Math.random()*2, 'rgba(255,255,255,0.3)');
            points[i].circle = c;
        }
      
        eligibleObj['points']  = points;
        return eligibleObj;
    }

    function initHeader(eligibleObj,sourceId) {
        source  = sourceId;
        top     = eligibleObj.top;
        height  = eligibleObj['height'];
        width   = eligibleObj['width'];
        target  = {x: width/2, y: height/2};
        ctx     = eligibleObj['canvas'].getContext('2d');
        points  = eligibleObj['points'];
    }

    // Event handling
    function addListeners() {
        if(!('ontouchstart' in window)) {
            window.addEventListener('mousemove', mouseMove);
        }
        window.addEventListener('scroll', scrollCheck);
        window.addEventListener('resize', resize);
    }

    function mouseMove(e) {
        var posx = posy = 0;
        if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
        }
        else if (e.clientX || e.clientY)    {
            posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        target.x = posx;
        target.y = posy-top;

    }

    /*function scrollCheck() {
        if(position == 'both'){
            if($(document).scrollTop() < getHeight(1) ) {
		       if(source != 1){
		          initHeader(containerArray[0],1);
		          initAnimation();
		       }
            }else if(($(document).scrollTop() > getHeight(1))&&($(document).scrollTop() < getHeight(2)) &&($(document).scrollTop() < getHeight(3))) { 
		       if(source != 2){
		          initHeader(containerArray[1],2);
		          initAnimation();
		       }
           		if(source != 3){
		          initHeader(containerArray[2],3);
		          initAnimation();
		       }
            }
        }else{
            if($(document).scrollTop() < getHeight(1) ){
              return false;
            }else{
              return true;        
            }
        }
        
    }*/
  
   function scrollCheck() {
        if(position == 'both'){
            if($(document).scrollTop() < getHeight(1) ) {
		       if(source != 1){
		          initHeader(containerArray[0],1);
		          initAnimation();
		       }
            }else if(($(document).scrollTop() > getHeight(1))&&($(document).scrollTop() < getHeight(2))) { 
		       if(source != 2){
		          initHeader(containerArray[1],2);
		          initAnimation();
		       }
           		
            }else if(($(document).scrollTop() > getHeight(2))&&($(document).scrollTop() < getHeight(3))){
              if(source != 3){
		          initHeader(containerArray[2],3);
		          initAnimation();
		       }
			}else{
				if($(document).scrollTop() < getHeight(1) ){
					return false;
				}else{
					return true;
                }					
            }
        }
        
    }


    function resize() {
       /* width = window.innerWidth;
        height = window.innerHeight;
        largeHeader.style.height = height+'px';
        canvas.width = width;
        canvas.height = height;*/
    }

   function getHeight(index){
     if(index == 1){
       return $("#"+containerArray[0]['div_id']).height()+$("#"+containerArray[0]['div_id']).offset().top;
     }else if(index == 2){
       return $("#"+containerArray[1]['div_id']).height()+$("#"+containerArray[1]['div_id']).offset().top;
     }else{
       return $("#"+containerArray[2]['div_id']).height()+$("#"+containerArray[2]['div_id']).offset().top;
     }
    }
  
    // animation
    function initAnimation() {
        animate();
        for(var i in points) {
            shiftPoint(points[i]);
        }
    }

    function animate() {
        if(animateHeader) {
            ctx.clearRect(0,0,width,height);
            for(var i in points) {
                // detect points in range
                if(Math.abs(getDistance(target, points[i])) < 4000) {
                    points[i].active = 0.3;
                    points[i].circle.active = 0.6;
                } else if(Math.abs(getDistance(target, points[i])) < 20000) {
                    points[i].active = 0.1;
                    points[i].circle.active = 0.3;
                } else if(Math.abs(getDistance(target, points[i])) < 40000) {
                    points[i].active = 0.02;
                    points[i].circle.active = 0.1;
                } else {
                    points[i].active = 0;
                    points[i].circle.active = 0;
                }

                drawLines(points[i]);
                points[i].circle.draw();
            }
        }
        requestAnimationFrame(animate);
    }

    function shiftPoint(p) {
        TweenLite.to(p, 1+1*Math.random(), {x:p.originX-50+Math.random()*100,
            y: p.originY-50+Math.random()*100, ease:Circ.easeInOut,
            onComplete: function() {
                shiftPoint(p);
            }});
    }

    // Canvas manipulation
    function drawLines(p) {
        if(!p.active) return;
        for(var i in p.closest) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.closest[i].x, p.closest[i].y);
            ctx.strokeStyle = 'rgba(156,217,249,'+ p.active+')';
            ctx.stroke();
        }
    }

    function Circle(pos,rad,color) {
        var _this = this;

        // constructor
        (function() {
            _this.pos = pos || null;
            _this.radius = rad || null;
            _this.color = color || null;
        })();

        this.draw = function() {
            if(!_this.active) return;
            ctx.beginPath();
            ctx.arc(_this.pos.x, _this.pos.y, _this.radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'rgba(156,217,249,'+ _this.active+')';
            ctx.fill();
        };
    }

    // Util
    function getDistance(p1, p2) {
        return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
    }
    
})();