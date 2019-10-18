/*  demo.js http://github.com/bgrins/javascript-astar
    MIT License

    Set up the demo page for the A* Search
*/
/* global Graph, astar, $ */

var WALL = 0,
    performance = window.performance;

$(function() {

    var $grid = $("#search_grid"),
        $selectWallFrequency = $("#selectWallFrequency"),
        $selectGridSize = $("#selectGridSize"),
        $checkDebug = $("#checkDebug"),
        $searchDiagonal = $("#searchDiagonal"),
        $checkClosest = $("#checkClosest"),
        $allowTwoStep = $("#allowTwoStep");

    var opts = {
        wallFrequency: $selectWallFrequency.val(),
        gridSize: $selectGridSize.val(),
        debug: $checkDebug.is(":checked"),
        diagonal: true, //$searchDiagonal.prop("checked"),
        closest: true //$checkClosest.is("checked")
    };
    
    var grid = new GraphSearch($grid, opts, astar.search);
    grid.graph.diagonal = true; //$searchDiagonal.prop("checked");
    allowTwoStep = $allowTwoStep.prop("checked");

    $("#btnGenerate").click(function() {
        grid.initialize();
    });

    $("#replay").click(function() {
        $("#game-over").hide();
        $("#search_grid").css("pointer-events", "unset");
        $(".grid_item").css("cursor", "pointer");
        grid.initialize();
        grid.graph.diagonal = true; //$searchDiagonal.prop("checked");
    });

    $selectWallFrequency.change(function() {
        grid.setOption({wallFrequency: $(this).val()});
        grid.initialize();
    });

    $selectGridSize.change(function() {
        grid.setOption({gridSize: $(this).val()});
        grid.initialize();
    });

    $checkDebug.change(function() {
        grid.setOption({debug: $(this).is(":checked")});
    });

    $allowTwoStep.change(function(){
        allowTwoStep = $(this).prop("checked");
    })

    $searchDiagonal.change(function() {
        var val = $(this).prop(":checked");
        grid.setOption({diagonal: val});
        grid.graph.diagonal = val;
    });

    $checkClosest.change(function() {
        grid.setOption({closest: $(this).is(":checked")});
    });



    $("#generateWeights").click( function () {
        if ($("#generateWeights").prop("checked")) {
            $('#weightsKey').slideDown();
        } else {
            $('#weightsKey').slideUp();
        }
    });

});

var css = { start: "start", finish: "finish", wall: "wall", active: "active" };
var allowTwoStep = false;

function GraphSearch($graph, options, implementation) {
    this.$graph = $graph;
    this.search = implementation;
    this.opts = $.extend({wallFrequency:0.1, debug:true, gridSize:10}, options);
    this.initialize();
}
GraphSearch.prototype.setOption = function(opt) {
    this.opts = $.extend(this.opts, opt);
    this.drawDebugInfo();
};
GraphSearch.prototype.initialize = function() {
    this.grid = [];
    var self = this,
        nodes = [],
        $graph = this.$graph;
    $graph.empty();
    this.stepCount = 0;

    var cellWidth = ($graph.width()/this.opts.gridSize)-2,  // -2 for border
        cellHeight = ($graph.height()/this.opts.gridSize)-2,
        $cellTemplate = $("<span />").addClass("grid_item").width(cellWidth).height(cellHeight),
        startSet = false;

    for(var x = 0; x < this.opts.gridSize; x++) {
        var $row = $("<div class='clear' />"),
            nodeRow = [],
            gridRow = [];

        for(var y = 0; y < this.opts.gridSize; y++) {
            var id = "cell_"+x+"_"+y,
                $cell = $cellTemplate.clone(),
                isCenter = (x === Math.ceil(this.opts.gridSize/2) && y === Math.ceil(this.opts.gridSize/2)),
                isWall = 1;
            $cell.attr("id", id).attr("x", x).attr("y", y);
            $row.append($cell);
            gridRow.push($cell);

            if(!isCenter){
                isWall = Math.floor(Math.random()*(1/self.opts.wallFrequency));    
            }
            
            if(isWall === 0) {
                nodeRow.push(WALL);
                $cell.addClass(css.wall);
            }
            else  {
                var cell_weight = ($("#generateWeights").prop("checked") ? (Math.floor(Math.random() * 3)) * 2 + 1 : 1);
                nodeRow.push(cell_weight);
                $cell.addClass('weight' + cell_weight);
                if ($("#displayWeights").prop("checked")) {
                    $cell.html(cell_weight);
                }
                if (!startSet && isCenter) {
                    $cell.addClass(css.start);
                    startSet = true;
                }
            }
        }
        $graph.append($row);

        this.grid.push(gridRow);
        nodes.push(nodeRow);
    }

    this.graph = new Graph(nodes);

    // bind cell event, set start/wall positions
    this.$cells = $graph.find(".grid_item");
    this.$cells.click(function() {
        self.cellClicked($(this));
    });
    this.getBoundary();
};

GraphSearch.prototype.getBoundary = function(){
    this.boundary = [];
    for(var x=0; x< this.opts.gridSize; x++){
        for(var y=0; y< this.opts.gridSize; y++){
            if(x===0 || y===0 || x===this.opts.gridSize-1 || y===this.opts.gridSize-1){
                if(this.graph.grid[x][y].weight !== 0){
                    this.boundary.push(this.graph.grid[x][y]);
                }
            }
        }
    }
}
GraphSearch.prototype.cellClicked = function($end) {

    var end = this.nodeFromElement($end);
   
    // if($end.hasClass(css.wall) || $end.hasClass(css.start)) {
    //     return;
    // }

    // this.$cells.removeClass(css.finish);
    // $end.addClass("finish");
    var $start = this.$cells.filter("." + css.start),
        start = this.nodeFromElement($start);

        if(start == end){
            return;
        }

    if(this.boundary.findIndex(x => x == start) > -1){
        $start.removeClass(css.start).removeClass(css.active);
        $gameOver = $("#game-over");
        let $gameOverText = $(".game-over");
        $gameOver.show();
        $gameOver.css("background-image", "url('rat.png')");
        $gameOverText.html("I escaped this time, yayyyy!!!");
        $("#search_grid").css("pointer-events", "none");
        $(".grid_item").css("cursor", "default");
        return;
    }
    $end.removeClass("weight1").addClass(css.wall);
    this.updateWall($end);
    this.stepCount++;
    if(allowTwoStep && this.stepCount < 2){
        return;
    }else{
        this.stepCount = 0;
    }

    // const allowDiagonal = Math.floor(Math.random()*5); 
    // if(allowDiagonal === 0 || allowDiagonal === 2 || allowDiagonal === 4){
    //     this.setOption({diagonal: false});
    //     this.graph.diagonal = false;
    // }else{
    //     this.setOption({diagonal: true});
    //     this.graph.diagonal = true;
    // }

    var sTime = performance ? performance.now() : new Date().getTime();
    var paths =[];
    for(var i = 0; i< this.boundary.length; i++){
        let path = this.search(this.graph, start, this.boundary[i], {
            closest: this.opts.closest
        });
        if(path.length > 0){
            paths.push(path);        
        }
    }

    if(paths.length === 0){
        debugger;
        let $gameOver = $("#game-over");
        let $gameOverText = $(".game-over");
        $gameOver.show();
        $gameOver.css("background-image", "url('trapped-rat.jpg')");
        $gameOverText.html("You got me this time!! Congratulations!! Can you trap me again?");
        $("#search_grid").css("pointer-events", "none");
        $(".grid_item").css("cursor", "default");
        return;
    }

    let audio = new Audio("rat2.wav");
    audio.play();
    var path =  paths.sort((a, b) => a.length - b.length)[0];
    var fTime = performance ? performance.now() : new Date().getTime(),
        duration = (fTime-sTime).toFixed(2);

    if(path.length === 0) {
        $("#message").text("couldn't find a path (" + duration + "ms)");
        this.animateNoPath();
    }
    else {
        $("#message").text("search took " + duration + "ms.");
        this.drawDebugInfo();
        const next = this.getNextCell(start, path, this.boundary); //path.sort((a, b) => a.g - b.g)[0];
        //this.animatePath([next]);
        this.updatePosition(next);
    }
};
GraphSearch.prototype.drawDebugInfo = function() {
    this.$cells.html(" ");
    var that = this;
    if(this.opts.debug) {
        that.$cells.each(function() {
            var node = that.nodeFromElement($(this)),
                debug = false;
            if (node.visited) {
                debug = "F: " + node.f + "<br />G: " + node.g + "<br />H: " + node.h;
            }

            if (debug) {
                $(this).html(debug);
            }
        });
    }
};

GraphSearch.prototype.getNextCell = function(node, path, boundary){
    let next;
    path = [...path];
    node = {...node};
    boundary = [...boundary];
    const nextArray = path.filter((curr) => {
        return(
            (curr.x == node.x && curr.y == node.y-1) || (curr.x == node.x && curr.y == node.y+1) ||
            (curr.x == node.x-1 && curr.y == node.y-1) || (curr.x == node.x-1 && curr.y == node.y) ||
            (curr.x == node.x-1 && curr.y == node.y+1) ||
            (curr.x == node.x+1 && curr.y == node.y-1) || (curr.x == node.x+1 && curr.y == node.y) ||
            (curr.x == node.x+1 && curr.y == node.y+1)
        );
    });
    const boundaryNext = nextArray.filter(elem => {
        return (boundary.indexOf(elem) > -1)
    });
    if(boundaryNext.length > 0){
        next = boundaryNext[0];
    }else{
        next = nextArray[0];
    }
    return next;
}

GraphSearch.prototype.updateWall = function($cell){
    const xCord = parseInt($cell.attr("x"));
    const yCord = parseInt($cell.attr("y"));
    const index = this.boundary.findIndex((node)=> node == this.graph.grid[xCord][yCord]);
    this.boundary.splice(index, 1);
    this.graph.grid[xCord][yCord].weight = WALL;
}

GraphSearch.prototype.nodeFromElement = function($cell) {
    return this.graph.grid[parseInt($cell.attr("x"))][parseInt($cell.attr("y"))];
};
GraphSearch.prototype.animateNoPath = function() {
    var $graph = this.$graph;
    var jiggle = function(lim, i) {
        if(i>=lim) { $graph.css("top", 0).css("left", 0); return; }
        if(!i) i=0;
        i++;
        $graph.css("top", Math.random()*6).css("left", Math.random()*6);
        setTimeout(function() {
            jiggle(lim, i);
        }, 5);
    };
    jiggle(15);
};

GraphSearch.prototype.updatePosition = function(newPositionNode){
    var grid = this.grid,
        elementFromNode = function(node) {
            return grid[node.x][node.y];
        };
    this.$graph.find("." + css.start).removeClass(css.active).removeClass(css.start);
    elementFromNode(newPositionNode).addClass(css.active).addClass(css.start);
}

GraphSearch.prototype.animatePath = function(path) {
    var grid = this.grid,
        timeout = 1000 / grid.length,
        elementFromNode = function(node) {
        return grid[node.x][node.y];
    };

    var self = this;
    // will add start class if final
    var removeClass = function(path, i) {
        if(i >= path.length) { // finished removing path, set start positions
            return setStartClass(path, i);
        }
        elementFromNode(path[i]).removeClass(css.active);
        setTimeout(function() {
            removeClass(path, i+1);
        }, timeout*path[i].getCost());
    };
    var setStartClass = function(path, i) {
        if(i === path.length) {
            self.$graph.find("." + css.start).removeClass(css.start);
            elementFromNode(path[i-1]).addClass(css.start);
        }
    };
    var addClass = function(path, i) {
        if(i >= path.length) { // Finished showing path, now remove
            return removeClass(path, 0);
        }
        elementFromNode(path[i]).addClass(css.active);
        setTimeout(function() {
            addClass(path, i+1);
        }, timeout*path[i].getCost());
    };

    addClass(path, 0);
    this.$graph.find("." + css.start).removeClass(css.start);
    this.$graph.find("." + css.finish).removeClass(css.finish).addClass(css.start);
};
