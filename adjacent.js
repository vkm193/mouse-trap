var getNextCell = function(node, path, boundary){
    let next;
    const nextArray = path.filter((curr) => {
        return(
            (curr.x == node.x && curr.y == node.y-1) || (curr.x == node.x && curr.y == node.y+1) ||
            (curr.x == node.x-1 && curr.y == node.y-1) || (curr.x == node.x-1 && curr.y == node.y) ||
            (curr.x == node.x-1 && curr.y == node.y+1) ||
            (curr.x == node.x+1 && curr.y == node.y-1) || (curr.x == node.x+1 && curr.y == node.y) ||
            (curr.x == node.x+1 && curr.y == node.y+1)
        );
    });
    const boundaryNext = nextArray.every(elem => boundary.indexOf(elem) > -1);
    if(boundaryNext.length > 0){
        next = boundaryNext[0];
    }else{
        next = nextArray[0];
    }
    return next;
}