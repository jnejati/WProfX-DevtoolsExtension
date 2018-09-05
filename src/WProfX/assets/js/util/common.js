var common = {};

common.convertIdtoHex=function (_trace){
  for (trace_event in _trace){
    if (_trace.hasOwnProperty(trace_event)) {
      if ('args' in trace_event && 'id' in trace_event && 'name' in trace_event && 'source_type' in trace_event[
          'args']){
            // Convert the source event id to hex if one exists
            if ('params' in trace_event['args'] && 'source_dependency' in
                trace_event['args']['params'] && 'id' in
                trace_event['args']['params']['source_dependency']){
                      dependency_id = parseInt(trace_event['args']['params']['source_dependency']['id']);
                      trace_event['args']['params']['source_dependency']['id'] = '0x' + dependency_id +'x';
                    }
          }
      }
  }
  return _trace;
}

common.isBalanced=function (_array){
  var my_array = [..._array]; //cloned
  var _tmpStack = [];
  var _length = my_array.length;
  for (var j=0; j < _length; j++){
    if (my_array[j]['ph'] == 'B'){
      _tmpStack.push('B');
    }
    else if (my_array[j]['ph'] == 'E'){
      _tmpStack.pop();
    }
  }
  if (_tmpStack.length == 0){
    return true;
  }
  return false;
}

common.mergeEvents=function (_array){
  if (_array.length > 2){
    return [[_array[0], _array.slice(-1)[0]], [_array.slice(1, -1)]];
    //return [[_array[0], _array[-1]], [_array[1:-1]]];
  }
  else{
    return [[_array[0], _array.slice(-1)[0]]];
    //return [[_array[0], _array[-1]]];
  }
}

common.mapToJson=function (map) {
    return JSON.stringify([...map]);
}

common.getCol=function(matrix, col){
     var column = [];
     for(var i=0; i<matrix.length; i++){
        column.push(matrix[i][col]);
     }
     return column;
  }
