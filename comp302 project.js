/**
 * Created by Benjamin on 26/06/2017.
 */

var TSTART = /{{/ ;
var TEND =/}}/ ;
var PIPE = /[|]/ ;
var OUTERTEXT = /^((?!({{|{:)).)+/ ;
var INNERTEXT = /^((?!({{|{:|{{{|[|]|}})).)+/ ;
var DSTART = /{:/ ;
var DEND = /:}/ ;
var INNERDTEXT = /^((?!({{|{:|{{{|[|]|:})).)+/ ;
var PSTART = /{{{/ ;
var PEND =/}}}/ ;
var PNAME = /^((?!([|]|}}})).)+/ ;
var PSTART = /{{{/ ;
var PEND = /}}}/ ;




function scan(s, tokenset) {

    if (tokenset["PSTART"] && s.search(PSTART)==0) {
        return {token: 'PSTART', value: '{{{'} ;
    }

    if (tokenset["TSTART"] && s.search(TSTART)==0) {
        return {token: 'TSTART', value: '{{'} ;
    }

    if (tokenset['TEND'] && s.search(TEND)==0) {
        return {token: 'TEND', value: '}}'} ;
    }
    if (tokenset["PIPE"] && s.search(PIPE)==0) {
        return {token: 'PIPE', value: '|'} ;
    }

    if (tokenset["DSTART"] && s.search(DSTART)==0) {
        return {token: 'DSTART', value: '{:'} ;
    }

    if (tokenset['DEND'] && s.search(DEND)==0) {
        return {token: 'DEND', value: ':}'} ;
    }

    if (tokenset["PEND"] && s.search(PEND)==0) {
        return {token : 'PEND', value: '}}}'} ;
    }
    if (tokenset["OUTERTEXT"] && s.search(OUTERTEXT)==0) {
        return {token: 'OUTERTEXT', value: s.match(OUTERTEXT)[0]} ;
    }
    if (tokenset["INNERTEXT"] && s.search(INNERTEXT)==0 ) {
        return {token: 'INNERTEXT', value: s.match(INNERTEXT)[0]} ;
    }
    if (tokenset["INNERDTEXT"] && s.search(INNERDTEXT) == 0) {
        return {token: 'INNERDTEXT', value: s.match(INNERDTEXT)[0]} ;
    }
    if (tokenset["PNAME"] && s.search(PNAME)==0) {
        return {token: 'PNAME', value: s.match(PNAME)[0]} ;
    }
}







//this function receives a string s starting with DSTART and returns a string that contains the entire templatedefinition that DSTART started
function findEntireTemplateDef(s) {
    var str = s.substr(2) ; // remove DSTART at start of s
    var cnt = 1 ;
    var index = 2 ;
    while (cnt != 0) {
        if (str.search(DSTART)==-1) {
            cnt-- ;
            index += str.search(DEND)+2  ;
            str = str.substr(str.search(DEND)+2) ;
        }

        else if (str.search(DSTART) < str.search(DEND)) {
            cnt++;
            index += str.search(DSTART)+2  ;
            str = str.substr(str.search(DSTART)+2) ;
        }

        else {
            cnt--;
            index += str.search(DEND)+2  ;
            str = str.substr(str.search(DEND)+2) ;
        }
    }
    return s.substr(0,index) ;
}




//this function receives a string s starting with PSTART and returns a string that is the entire tparam that PSTART started
function findEntireTParam(s) {
    var str = s.substr(3) ; // remove PSTART at start of s
    var cnt = 1 ;
    var index = 3 ;
    while (cnt != 0) {
        if (str.search(PSTART)==-1) {
            cnt-- ;
            index += str.search(PEND)+3  ;
            str = str.substr(str.search(PEND)+3) ;
        }

        else if (str.search(PSTART) < str.search(PEND)) {
            cnt++;
            index += str.search(PSTART)+3  ;
            str = str.substr(str.search(PSTART)+3) ;
        }

        else {
            cnt--;
            index += str.search(PEND)+3  ;
            str = str.substr(str.search(PEND)+3) ;
        }
    }
    return s.substr(0,index) ;
}





//function takes as input a string starting with TSTART and returns the entire templateinvocation that TSTART started
function findEntireTemplateInvocation(s) {
    var str = s.substr(2) ; // remove TSTART at start of s
    var cnt = 1 ;
    var index = 2 ;
    while (cnt != 0) {
        if (str.search(TSTART)==-1) {
            cnt-- ;
            index += str.search(TEND)+2  ;
            str = str.substr(str.search(TEND)+2) ;
        }


        else if (str.search(TSTART) < str.search(TEND)) {
            if (str.search(TSTART) == str.search(PSTART)){
                //in that case we did not find a TSTART we found a PSTART
                index += str.search(PSTART) ;
                // str1 is the part of the string before the TSTART
                var str1 = str.substr(0,str.search(PSTART)) ;
                index += findEntireTParam(str.substr(str.search(PSTART))).length ;
                str = str.substr(str1.length + findEntireTParam(str.substr(str1.length)).length) ;
            }
            else {
                cnt++;
                index += str.search(TSTART)+2  ;
                str = str.substr(str.search(TSTART)+2) ;
            }
        }

        else {
            cnt--;
            index += str.search(TEND)+2  ;
            str = str.substr(str.search(TEND)+2) ;
        }
    }
    return s.substr(0,index) ;
}







// this function takes as input a string representing a templateinvocation or templatedef and finds if there exists a PIPE separating itext and targs
//if there is it returns the index of that PIPE
//if not it returns -1
function findPipeInTemplate(s) {

    var modifiedString = s.substr(2,s.length-2) ; //remove the TSTART or DSTART at the start and TEND or DEND at the end

    function findPipeHelper(str, cnt){
        if (str==''){
            return -1 ;
        }

        else if (str.search(PIPE)==0){
            return cnt ;
        }

        else if(str.search(TSTART)==0) {
            // then we have a templateinvocation, and we can't find the PIPE in the entire templateinvocation, so we need to jump it
            var str1 = findEntireTemplateInvocation(str) ;
            return findPipeHelper(str.substr(str1.length), cnt + str1.length) ;
        }

        else if(str.search(DSTART)==0) {
            //then we have a templatedef, and we can't find the PIPE in the entire templatedef, so we need to jump it
            var str1 = findEntireTemplateDef(str) ;
            return findPipeHelper(str.substr(str1.length), cnt + str1.length) ;
        }

        else if(str.search(PSTART)==0) {
            //then we have a tparam, and we can't find the PIPE in the entire tparam, so we need to jump it
            var str1 = findEntireTParam(str) ;
            return findPipeHelper(str.substr(str1.length), cnt + str1.length) ;
        }


        else{
            //then the element at 0 is just a 'normal' character, we are in innertext
            return findPipeHelper(str.substr(1),cnt + 1) ;
        }
    }

    return findPipeHelper(modifiedString,2) ;

}



//this function takes as input a string representing a targs or a deftext
//if there is a PIPE that belongs to them ( ie recursive call)
//then it returns the index of that PIPE
//otherwise it returns -1
function findNextPipe(s) {

    function findNextPipeHelper(str, cnt){
        if (str==''){
            return -1 ;
        }

        else if (str.search(PIPE)==0){
            return cnt ;
        }

        else if(str.search(TSTART)==0) {
            // then we have a templateinvocation, and we can't find the PIPE in the entire templateinvocation, so we need to jump it
            var str1 = findEntireTemplateInvocation(str) ;
            return findNextPipeHelper(str.substr(str1.length), cnt + str1.length) ;
        }

        else if(str.search(DSTART)==0) {
            //then we have a templatedef, and we can't find the PIPE in the entire templatedef, so we need to jump it
            var str1 = findEntireTemplateDef(str) ;
            return findNextPipeHelper(str.substr(str1.length), cnt + str1.length) ;
        }

        else if(str.search(PSTART)==0) {
            //then we have a tparam, and we can't find the PIPE in the entire tparam, so we need to jump it
            var str1 = findEntireTParam(str) ;
            return findNextPipeHelper(str.substr(str1.length), cnt + str1.length) ;
        }


        else{
            //then the element at 0 is just a 'normal' character, we are in innertext
            return findNextPipeHelper(str.substr(1),cnt + 1) ;
        }
    }

    return findNextPipeHelper(s,0) ;

}








function parseOuter(s){

    if (s=='') {
        return null ;
    }


    var tokenset = {OUTERTEXT: true, TSTART: true, DSTART: true} ;
    var firstToken = scan(s,tokenset) ;

    if (firstToken.token == 'OUTERTEXT') {
        return {name: 'outer',
            OUTERTEXT: firstToken.value,
            templateinvocation: null,
            templatedef: null,
            next: parseOuter(s.substr(firstToken.value.length))} ;
    }

    if (firstToken.token == 'TSTART') {
        return {name: 'outer',
            OUTERTEXT: null,
            templateinvocation: parseTemplateInvocation(findEntireTemplateInvocation(s)),
            templatedef: null,
            next: parseOuter(s.substr(findEntireTemplateInvocation(s).length))} ;
    }

    if (firstToken.token == 'DSTART') {
        return {name: 'outer',
            OUTERTEXT: null,
            templateinvocation: null,
            templatedef: parseTemplateDef(findEntireTemplateDef(s)),
            next: parseOuter(s.substr(findEntireTemplateDef(s).length))} ;
    }

}





function parseTemplateInvocation(s){
    var indexOfPipe = findPipeInTemplate(s) ;

    if (indexOfPipe == -1) {
        //then there is no PIPE, so there are no targs
        // there is either itext or nothing at all
        if (s.search(TEND)==2) {
            //no itext either
            return {name: 'templateinvocation',
                itext: null,
                targs: null} ;
        }

        else {
            // case where there is itext
            var str = s.substr(0, s.length - 2) ;
            str = str.substr(2) ;
            if (s.charAt(2) == ' ' && str.search(TSTART) == 1 && s.search(PSTART) != 1) {
                // nested templateinvocation, remove space
                return {name: 'templateinvocation',
                    itext: parseitext(str.substr(1,str.length-2)),
                    targs: null} ;
            }
            else {
                return {name: 'templateinvocation',
                    itext: parseitext(str),
                    targs: null} ;
            }
        }
    }

    else {
        //then there is a PIPE separating itext and targs

        var str = s.substr(0, s.length - 2) ;
        str  = str.substr(2) ;
        if (s.charAt(2) == ' ' && str.search(TSTART) == 1 && str.search(PSTART) != 1){
            // nested templateinvocation, remove space
            return {name: 'templateinvocation',
                itext: parseitext(s.substr(3,indexOfPipe - 2)),
                targs: parsetargs(str.substr(indexOfPipe -1, str.length - 2))} ;
        }
        else {
            // no nested templateinvocation
            return {name: 'templateinvocation',
                itext: parseitext(s.substr(2 , indexOfPipe - 2)),
                targs: parsetargs(str.substr(indexOfPipe -1))};
        }
    }
}



//for templatedefinition we create a new property
// recall that <templatedef ::= DSTART <dtext> (PIPE <dtext>)+ DEND
//now we name the <deftext> ::= (PIPE <dtext>)+
// therefore the AST for templatedef has 2 properties : dtext and deftext
//the structure of templatedef is now <templatedef ::= DSTART <dtext> <deftext> DEND
function parseTemplateDef(s){
    //in this case we know we are going to find a PIPE part of the template def in s because of the grammar definition of templatedef
    var indexOfPipe = findPipeInTemplate(s) ;
    var str = s.substr(0, s.length - 2) ;
    return {name: 'templatedef',
        dtext: parsedtext(s.substr(2 , indexOfPipe - 2)),
        deftext: parsedeftext(str.substr(indexOfPipe + 1))
    } ;
}







function parseTParam(s) {
    //easy to parse, only PNAME inside it
    var str = s.substr(0, s.length - 3) ;
    return {name: 'tparam',
        PNAME: str.substr(3).trim()} ;  //remove leading and trailing spaces
}






function parseitext(s){
    if (s=='') {
        return null ;
    }

    var tokenset = {INNERTEXT: true, TSTART: true, DSTART: true, PSTART: true} ;
    var firstToken = scan(s,tokenset) ;

    if (firstToken.token == 'TSTART'){
        return {name: 'itext',
            INNERTEXT: null,
            templateinvocation: parseTemplateInvocation(findEntireTemplateInvocation(s)),
            templatedef: null,
            tparam: null,
            next: parseitext(s.substr(findEntireTemplateInvocation(s).length))};
    }

    else if (firstToken.token == 'DSTART'){
        return {name: 'itext',
            INNERTEXT: null,
            templateinvocation: null,
            templatedef: parseTemplateDef(findEntireTemplateDef(s)),
            tparam: null,
            next: parseitext(s.substr(findEntireTemplateDef(s).length))} ;
    }

    else if (firstToken.token == 'PSTART') {
        return {name: 'itext',
            INNERTEXT: null,
            templateinvocation: null,
            templatedef: null,
            tparam: parseTParam(findEntireTParam(s)),
            next: parseitext(s.substr(findEntireTParam(s).length))} ;
    }

    else {
        // that is the case INNERTEXT

        return {name: 'itext',
            INNERTEXT: firstToken.value.trim(),//remove leading and trailing spaces
            templateinvocation: null,
            templatedef: null,
            tparam: null,
            next: parseitext(s.substr(firstToken.value.length))};
    }
}







function parsetargs(s) {
    var indexOfPipe = findNextPipe(s) ;

    if (indexOfPipe == -1) {
        //no pipe, only 1 itext
        return {name: 'targs',
            itext: parseitext(s),
            next:null};
    }

    else {
        //then there is a pipe, hence several instances of targs
        return {name: 'targs',
            itext: parseitext(s.substr(0,indexOfPipe)),
            next: parsetargs(s.substr(indexOfPipe + 1))} ;
    }
}







function parsedtext(s){
    if (s==''){
        return null ;
    }

    var tokenset = {INNERDTEXT: true, TSTART: true, DSTART: true, PSTART: true} ;
    var firstToken = scan(s,tokenset) ;

    if (firstToken.token == 'TSTART'){
        return {name: 'dtext',
            INNERDTEXT: null,
            templateinvocation: parseTemplateInvocation(findEntireTemplateInvocation(s)),
            templatedef: null,
            tparam: null,
            next: parsedtext(s.substr(findEntireTemplateInvocation(s).length))};
    }

    else if (firstToken.token == 'DSTART'){
        return {name: 'dtext',
            INNERDTEXT: null,
            templateinvocation: null,
            templatedef: parseTemplateDef(findEntireTemplateDef(s)),
            tparam: null,
            next: parsedtext(s.substr(findEntireTemplateDef(s).length))} ;
    }

    else if (firstToken.token == 'PSTART') {
        return {name: 'dtext',
            INNERDTEXT: null,
            templateinvocation: null,
            templatedef: null,
            tparam: parseTParam(findEntireTParam(s)),
            next: parsedtext(s.substr(findEntireTParam(s).length))} ;
    }

    else {
        // that is the case INNERDTEXT
        return {name: 'dtext',
            INNERDTEXT: firstToken.value.trim(),//remove leading and trailing spaces
            templateinvocation: null,
            templatedef: null,
            tparam: null,
            next: parsedtext(s.substr(firstToken.value.length))};
    }

}







function parsedeftext(s){
    //if (s==''){
    //return null ;
    //}

    var indexOfPipe = findNextPipe(s) ;

    if ( indexOfPipe == -1) {
        return {name: 'deftext',
            dtext: parsedtext(s),
            next: null};
    }
    else {
        //we have a PIPE, so second instance of deftext
        return {name: 'deftext',
            dtext: parsedtext(s.substr(0,indexOfPipe )),
            next: parsedeftext(s.substr(indexOfPipe+1))};
    }
}






function createEnv(parent){
    return {name:Math.random(),
        bindings:{},
        parent:parent};
}


function lookup(name,env){
    //first lookup in current environment
    if (env.bindings[name] || env.bindings[name]==''){
        return env.bindings[name] ;
    }

    else {
        if (env.parent != null){
            return lookup(name,env.parent);
        }
        else {
            return null ;
        }
    }
}



//ast it an outer AST node
function evalWML(ast,env){
    // we check for the different tokens we can find in outertext, then delegate to other functions

    if (ast == null) {
        return '' ;
    }


    if (ast.OUTERTEXT){
        return ast.OUTERTEXT + evalWML(ast.next,env) ;
    }


    if (ast.templateinvocation) {
        return evalTemplateinvocation(ast.templateinvocation,env) + evalWML(ast.next,env);
    }


    if (ast.templatedef) {
        return evalTemplateDef(ast.templatedef,env) + evalWML(ast.next,env) ;
    }
}


function evalTemplateDef(ast,env){
    // first we need the name of the template definition
    var name = getTemplateName(ast,env) ;

    //check if it is a closure, if so delegate to other function
    if (name.charAt(0)=='`'){
        return evalClosure(ast,env) ;
    }


    var obj ={} ;

    //we build the array of parameters
    var params = [] ;
    var parameter = ast.dparams ;
    // we get all dparams except the last
    while(parameter.next!=null){
        params.push(parameter.dtext.INNERDTEXT) ;
        parameter = parameter.next ;
    }

    // the last dparams is the body
    var body = parameter ;

    obj.params = params ;
    obj.body = body ;
    obj.env = env ;

    //add it to the bindings of the current environment
    env.bindings[name] = obj ;
    return '' ;

}

//next function a template definition ast and returns the name of it
function getTemplateName(ast,env){
    var node = ast.dtext ;
    if (node.templateinvocation){
        return evalTemplateinvocation(node.templateinvocation,env) ;
    }
    else if (node.templatedef){
        return evalTemplateDef(node.templatedef,env) ;
    }
    else if (node.tparam){
        return evalTParam(node.tparam,env) ;
    }
    else {
        // then it is INNERDTEXT
        return node.INNERDTEXT ;
    }
}





//ast is a templateinvocation node
function evalTemplateinvocation(ast,env) {
    var node = ast.itext ;

    //first test if we have an empty INNERTEXT
    if (node.INNERTEXT!=null && (node.INNERTEXT).trim().length==0 ) {
        node = node.next ;
    }


    var obj ;

    // we want to find the name of the template if it exists

    if (node.templateinvocation){
        obj = lookup(evalTemplateinvocation(node.templateinvocation,env),env) ;
        if (obj == null){
            obj = unstringify(evalTemplateinvocation(node.templateinvocation,env)) ;
        }
    }

    else if (node.templatedef){
        obj = lookup(evalTemplateDef(node.templatedef,env),env) ;
        if (obj == null){
            obj = unstringify(evalTemplateDef(node.templatedef,env)) ;
        }
    }

    else if (node.tparam){
        obj = lookup(evalTParam(node.tparam,env),env) ;
        if (obj==null) {
            obj = unstringify(evalTParam(node.tparam, env));
        }

    }

    else {
        //then it is INNERTEXT
        // we test for the special characters we can find in INNERTEXT
        if (node.INNERTEXT=='#expr'){
            return evalExpr(ast,env) ;
        }
        if (node.INNERTEXT=='#ifeq'){
            return evalIfEq(ast,env) ;
        }
        if (node.INNERTEXT == '#if'){
            return evalIf(ast,env) ;
        }
        obj = lookup(node.INNERTEXT,env) ;
    }


    if (obj == null) {
        return '{{' + node.INNERTEXT + '}}' ;
    }

    // we create a new environment
    var E1 = createEnv(obj.env) ;

    // now we create an array of the arguments passed in the invocation
    var args = [] ;
    var argument = ast.targs ;
    while (argument != null) {
        var argEvaluated = evalItext(argument.itext,env) ;
        args.push(argEvaluated) ;
        argument = argument.next ;
    }


    for (var i = 0 ; i < obj.params.length ; i++) {
        E1.bindings[obj.params[i]] = args[i] ;
    }

    console.log(E1.bindings) ;

    return evalBody(obj.body.dtext,E1) ;

}



function evalItext(ast,env){
    // we test the different nodes we can find in itext and then delegate to other functions
    if (ast == null) {
        return '' ;
    }

    if (ast.INNERTEXT) {
        return ast.INNERTEXT + evalItext(ast.next,env) ;
    }

    if (ast.templateinvocation) {
        return evalTemplateinvocation(ast.templateinvocation,env) + evalItext(ast.next,env) ;
    }

    if (ast.templatedef){
        return evalTemplateDef(ast.templatedef,env) + evalItext(ast.next,env) ;
    }

    if (ast.tparam){
        return evalTParam(ast.tparam,env) + evalItext(ast.next,env) ;
    }
}


function evalTParam(ast,env) {

    var value = lookup(ast.pname,env) ;

    if (value == null){
        // if value is unknown we just return it as it was typed
        return '{{{'+ast.pname + '}}}' ;
    }
    return value ;
}








function evalBody(ast,env) {
    //we test for the different nodes we can find in the body of a template, and then delegate to other functions

    var node = ast ;
    if (node==null){
        return '' ;
    }

    if (node.INNERDTEXT){
        return node.INNERDTEXT + evalBody(node.next,env) ;
    }

    if (node.templateinvocation){
        return evalTemplateinvocation(node.templateinvocation,env) + evalBody(node.next,env) ;
    }

    if (node.templatedef){
        return evalTemplateDef(node.templatedef,env) + evalBody(node.next,env) ;
    }

    if (node.tparam){
        return evalTParam(node.tparam,env) + evalBody(node.next,env) ;
    }
}







function evalExpr(ast,env){
    //on targs.itext use the eval() function
    return eval(evalItext(ast.targs.itext,env)) ;
}



function evalIfEq(ast,env) {
    //we get targs
    var node = ast.targs ;
    //get the first value to compute
    var a = evalItext(node.itext,env) ;
    // now get second value
    node = node.next ;
    var b = evalItext(node.itext,env) ;
    if (a==b){
        //then it is the 'then' condition that comes right after b
        node = node.next ;
        return evalItext(node.itext,env) ;
    }
    else {
        //then it is the 'else' condition, we have to do next twice
        node = node.next.next ;
        return evalItext(node.itext,env) ;
    }
}


function evalIf(ast,env) {
    var node = ast.targs ;
    var cond  = evalItext(node.itext,env) ;

    //check condition
    if (cond != ''){
        return evalItext(node.next.itext,env) ;
    }
    else {
        return evalItext(node.next.next.itext,env) ;
    }
}

function evalClosure(ast,env){
    var name = getTemplateName(ast,env);
    if (name == '`'){
        var obj ={} ;

        //we build the array of parameters
        var params = [] ;
        var parameter = ast.dparams ;
        // we get all dparams except the last
        while(parameter.next!=null){
            params.push(parameter.dtext.INNERDTEXT) ;
            parameter = parameter.next ;
        }

        // the last dparams is the body
        var body = parameter ;

        obj.params = params ;
        obj.body = body ;
        obj.env = env ;

        return stringify(obj) ;
    }
    else {
        // then there is a name
        var obj ={} ;

        //we build the array of parameters
        var params = [] ;
        var parameter = ast.dparams ;
        // we get all dparams except the last
        while(parameter.next!=null){
            params.push(parameter.dtext.INNERDTEXT) ;
            parameter = parameter.next ;
        }

        // the last dparams is the body
        var body = parameter ;

        obj.params = params ;
        obj.body = body ;
        obj.env = env ;

        //remove the backquote
        name = name.substr(1) ;
        // save the name in the bindings
        env.bindings[name] = obj ;
        return stringify(obj) ;
    }
}



function makeN(n){
    return function (f,x){
        var result = x ;
        for (var i = 0 ; i< n ; i++){
            result = f(result) ;
        }
        return result ;
    }
}

function makeNrec(n) {
    function makeNHelper (f,x,n){
        if (n==0){
            return x ;
        }
        else {
            return f(makeNHelper(f,x,n-1)) ;
        }
    }

    return function (f,x){
        return makeNHelper(f,x,n) ;
    }
}



function runCode(code){
    //create outer environment E0
    var E0 = createEnv(null) ;

    var parsedCode = parseOuter(code) ;
    result = evalWML(parsedCode) ;
    return result ;
}


var iftest = '{{#if| |true|false}}' ;

console.log(runCode(iftest)) ;








