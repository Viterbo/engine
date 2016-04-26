(function (undef) {
;var VERSION = "0.8.0",
    TreeQuery_prototype = [];

function TreeQuery(selector, context) {
    if (selector instanceof TreeQuery) return selector;
    if (arguments.length == 0) {
        if (!(this instanceof TreeQuery)) return new TreeQuery();
        return;
    }
    if (!(this instanceof TreeQuery)) return new TreeQuery(selector, context);
    this.length = 0;
    this._tq_selector = selector;
    this._tq_context  = context || this._tqGetDefaultContext();
    this._tq_strategy = this._tqGetStrategy();
    
    if (Array.isArray(selector)) {        
        for (var i in selector) {
            if (this.indexOf(selector[i]) == -1) this.push(selector[i]);
        }
        return this;
    }
    
    if (this._tq_strategy._tq_accepts(this._tq_selector)) {
        this.push(this._tq_selector);
        console.assert(this.length == 1, this);
        return this;
    }    
    
    if (typeof selector == "string") {
        if (selector=="body") {
            var body = this._tqGetDefaultContext();
            return new TreeQuery(body,body);
        }
        var result = this._tq_strategy._tq_parse(selector);
        if (result instanceof TreeQuery) {
            return result;
        } else {
            return new TreeQuery(this._tq_context, this._tq_context).find(selector);
        }
    }
    
}

TreeQuery.prototype = TreeQuery_prototype;
TreeQuery_prototype.constructor = TreeQuery;
TreeQuery_prototype._tqGetStrategy = function () {
    return TreeQuery.Factory.getStrategy(this._tq_selector, this._tq_context);
}

TreeQuery_prototype.valueOf = function () {
    return this.map(function (n) { return n; });
}

TreeQuery_prototype._tqGetDefaultContext = function () {
    return document.body;
}

TreeQuery_prototype.find = function (selector) {
    this._tq_selector = selector;
    return TreeQuery.Engine.resolve(this);
}

TreeQuery_prototype.children = function () {
    return TreeQuery.Engine.children(this);
}

TreeQuery_prototype.filter = function (selector) {
    this._tq_selector = selector;
    return TreeQuery.Engine.filter(this, selector);
}

TreeQuery._tq_version = VERSION;
TreeQuery._tq         = TreeQuery_prototype;
TreeQuery._tq_types   = {};

TreeQuery._tq_register_api = function (name, api) {
    for (var func in api) {
        if (typeof api[func] == "function") {
            TreeQuery._tq[func] = api[func];
        }
    }    
    
    /*
    var extensions = TreeQuery._tq_apis[name];    
    if (!extensions) extensions = {};
    
    for (var func in api) {
        if (typeof api[func] == "function") {
            extensions[func] = api[func];
        }
    }
    
    TreeQuery._tq_apis[name] = extensions;
    */
}

TreeQuery._tq_register_stratgy = function (name, api) {
    var base = new BaseStrategy();
    for (var func in base) {
        if (typeof base[func] == "function" && !api[func]) {
            api[func] = base[func];
        }
    }
    var strategy = TreeQuery._tq_types[name];    
    if (!strategy) strategy = new Strategy(name);
    
    for (var func in api) {
        if (typeof api[func] == "function") {
            strategy[func] = api[func];
        }
    }
    
    TreeQuery._tq_types[name] = strategy;
    
    for (var name in api) {
        if (typeof api[name] == "function" && !TreeQuery_prototype[name]) {
            
            (function (_name) {                
                TreeQuery_prototype[_name] = function () {
                    // this is TreeQuery                    
                    var args = Array.prototype.map.call(arguments, function (n) { return n; });
                    args.unshift(null);            // agrego un null al comienzo
                    args.push(0);                  // current index
                    args.push(this.length);        // total 
                    for (var i=0; i<this.length; i++) {
                        args[0]=this[i];           // current element
                        args[args.length-2]=i;     // current index
                        var result = this._tq_strategy[_name].apply(this._tq_strategy, args);
                        if (result != this._tq_strategy) {
                            return result;
                        }
                    }
                    
                    return this;
                };
            })(name);
            
        }
    }    
}
;TreeQuery.Filters = function (strategy) {
    this._filters = [];
    this._strategy = strategy;
}

TreeQuery.Filters.prototype = {};
TreeQuery.Filters.prototype.constructor = TreeQuery.Filters
TreeQuery.Filters.prototype.append = function (filter) {
    this._filters.push(filter);
}
TreeQuery.Filters.prototype.check = function (node, strategy) {
    var _strategy = strategy || this._strategy;
    if (!this._filters) console.warn("WARNING: check function not overwritten for this class: ", this);
    for (var i in this._filters) {
        console.assert(typeof this._filters[i].check == "function", this._filters[i]);
        if (!this._filters[i].check(node, _strategy)) return false;
    }
    return this._filters.length > 0;
}

TreeQuery.Filters.TageNameFilter = function (tagname) {
    this._tagname = tagname.toLowerCase();    
}
TreeQuery.Filters.TageNameFilter.prototype = new TreeQuery.Filters();
TreeQuery.Filters.TageNameFilter.prototype.constructor = TreeQuery.Filters.TageNameFilter
TreeQuery.Filters.TageNameFilter.prototype.check = function (node, strategy) {
    return strategy._tq_tag_name(node).toLowerCase() == this._tagname;
}


TreeQuery.Filters.IdFilter = function (id) {
    this._id = id.toLowerCase();    
}
TreeQuery.Filters.IdFilter.prototype = new TreeQuery.Filters();
TreeQuery.Filters.IdFilter.prototype.constructor = TreeQuery.Filters.IdFilter
TreeQuery.Filters.IdFilter.prototype.check = function (node, strategy) {
    var id = strategy._tq_id(node);;
    return typeof id == "string" ? id.toLowerCase() == this._id : false;
}


TreeQuery.Filters.ClassFilter = function (classname) {
    this._classname = classname.toLowerCase(); 
}
TreeQuery.Filters.ClassFilter.prototype = new TreeQuery.Filters();
TreeQuery.Filters.ClassFilter.prototype.constructor = TreeQuery.Filters.ClassFilter
TreeQuery.Filters.ClassFilter.prototype.check = function (node, strategy) {
    var list = strategy._tq_class(node);
    for (var i in list) {
        if (list[i].toLowerCase() == this._classname) return true;
    }
    return false;
}


TreeQuery.Filters.AsterFilter = function () {}
TreeQuery.Filters.AsterFilter.prototype = new TreeQuery.Filters();
TreeQuery.Filters.AsterFilter.prototype.constructor = TreeQuery.Filters.AsterFilter
TreeQuery.Filters.AsterFilter.prototype.check = function () {    
    return true;
}

;

TreeQuery.Engine = {
    parseSelector: function (selector) {
        return [];
    },    
    filter: function ($target) {
        var result = [];
        var filter = TreeQuery.Factory.getFilter($target._tq_selector, $target._tq_strategy);
        var list = $target.map(function (a) { return a; });                
        while (list.length > 0) {
            var obj = list.splice(0,1)[0];
            if ( filter.check(obj) ) {
                result.push(obj);
            }            
        }
        return TreeQuery(result, $target._tq_context);
    },    
    find: function ($target) {
        var result = [];
        var filter = TreeQuery.Factory.getFilter($target._tq_selector, $target._tq_strategy);
        var list = $target.map(function (a) { return a; });                
        while (list.length > 0) {
            var obj = list.splice(0,1)[0];
            var children = $target._tq_strategy._tq_children(obj);
            for (var index in children) {
                list.push(children[index]); // future revision
                if ( filter.check(children[index]) ) {
                    result.push(children[index]);
                }
            }
        }
        return TreeQuery(result, $target._tq_context);
    },
    apply: function ($target, name_func, args, results) {
        // recorre toda la lista de objetos que contiene $target        
    },
    resolve: function ($target) {
        var $ = TreeQuery;
        // console.log("Engine.resolve", arguments);
        console.assert(typeof $target._tq_selector == "string", $target._tq_selector);
        var list, result = [],
            _list_of_comma_parts  = $target._tq_selector.split(","),
            _list_of_spaces_parts = $target._tq_selector.split(" "),
            _selector_has_commas  = _list_of_comma_parts.length > 1,
            _selector_has_spaces  = _list_of_spaces_parts.length > 1;
        
        if (_selector_has_commas) {
            list = _list_of_comma_parts;
            for (var _select in list) {
                var array = 
                result = result.concat($target.find(list[_select]).valueOf());
            }
            return TreeQuery(result, $target._tq_context);
        } else if (_selector_has_spaces) {
            list = _list_of_spaces_parts;
            
            // div div
            // div > div
            function deep_search($t, selector) { return $t.find(selector); }
            function children($t, selector) { return $t.children().filter(selector); }
            var method = deep_search;
            $current = $target;
            for (var _select in list) {
                if (list[_select] == "") continue;
                if (list[_select] == ">") {
                    method = children;
                    continue;
                }
                $current = method($current, list[_select]);
                method = deep_search;
            }
            return $current;
        } else {
            
            return TreeQuery.Engine.find($target);
        }
        return $target;
    },
    children: function ($target) {
        var result = [];
        var list = $target.map(function (a) { return a; });                
        while (list.length > 0) {
            var obj = list.splice(0,1)[0];
            var children = $target._tq_strategy._tq_children(obj);
            result = result.concat(children);
        }
        return TreeQuery(result, $target._tq_context);
    },
    cache: {}
}
;TreeQuery.Factory = {
    getStrategy: function (selector, context) {
        // itera sobre los tipos definidos y a cada uno le pregunta si el contexto corresponde a su tipo.
        if (typeof TreeQuery.Factory.cache[context] != "undefined") return TreeQuery.Factory.cache[context]
        for (var name in TreeQuery._tq_types) {
            var strategy = TreeQuery._tq_types[name];        
            if (strategy._tq_accepts(context, selector)) {
                // TODO: acá tengo un memory leak?
                TreeQuery.Factory.cache[context] = strategy;
                return strategy;
            }
        }        
        return null;
    },
    getFilter: function (selector, strategy) {        
        console.assert(typeof selector == "string", selector);
        console.assert(selector.split(" ").length == 1, selector);
        /*
        var CLASS_SELECTOR = /(\.([\w-\d]+))+/;
        console.log( selector.match(CLASS_SELECTOR)  );
        // console.log( CLASS_SELECTOR.test(selector)  );
        if (selector.match(CLASS_SELECTOR)) {
            
        }
        */
        // ------
        var FUNCTION = /:(\w+)\(/,
            MODIFIER = /:(\w+)/
        ;
        var parts, tagname, id, class_list, modifier, modif_func, aster;
        
        tagname = selector;
        
        if (selector.indexOf(".") != -1) {
            var parts = selector.split(".");
            tagname = parts.splice(0,1)[0];            
            class_list = parts.map(function (n) {
                return n.split("[")[0].split(":")[0];
            });
        }
        
        if (selector == "*") {        
            tagname = "";
            aster = true;
        }
        
        if (selector.indexOf("#") != -1) {
            var parts = selector.split("#");
            tagname = parts[0];            
            id = parts[1].split("[")[0].split(":")[0];
        }
        
        if (selector.indexOf(":") != -1) {
            var parts = selector.split(":");
            modifier = parts[1];            
            id = parts[1].split("[")[0].split(":")[0];
        }
        
        if (FUNCTION.test(selector)) {
            // [":not(", "not"]
            var parts = text.match(FUNCTION);
            modif_func = parts[1];
        } else if (MODIFIER.test(selector)) {
            // [":not(", "not"]
            var parts = text.match(MODIFIER);
            modifier = parts[1];
        }
        
        // console.log(selector, "-->", tagname, id, class_list);
        
        var filter = new TreeQuery.Filters(strategy);
        
        if (aster) {
            filter.append(new TreeQuery.Filters.AsterFilter())
        }
        if (tagname) {
            filter.append(new TreeQuery.Filters.TageNameFilter(tagname))
        }
        if (id) {
            filter.append(new TreeQuery.Filters.IdFilter(id))
        }
        for (var i in class_list) {
            filter.append(new TreeQuery.Filters.ClassFilter(class_list[i]))
        }
        
        return filter;
    },
    cache: {}
};// ----------------------------------------------

var error_text = "ERROR: 'XXX' function must be overwritten";
function BaseStrategy(selector, context) {}

BaseStrategy.prototype = {};
BaseStrategy.prototype.constructor = BaseStrategy;

function Strategy(name) { this._tg_strategy = name; }
Strategy.prototype = new BaseStrategy();
Strategy.prototype.constructor = Strategy;

// -------------------------------

BaseStrategy.prototype._tq_accepts = function (node) {
    // reorna true si el node es del tipo que implementa esta estrategia
    console.error(error_text.replace("XXX", "check"));
    return false;
}

/*
BaseStrategy.prototype.eq = function (index) {
    return this[index];
}
    

BaseStrategy.prototype.is = function (node, selection) {
    console.assert(false, "TreeQuery.BaseStrategy.is NOT IMPLEMENTED YET");
    return $();
}
   
BaseStrategy.prototype.next = function () {
    // https://api.jquery.com/next/
    // Get the immediately following sibling of each element in the set of matched elements. If a selector is provided, it retrieves the next sibling only if it matches that selector.
    console.assert(false, "TreeQuery.BaseStrategy.next NOT IMPLEMENTED YET");
    return false;
}
    */
BaseStrategy.prototype._tq_class = function (node, new_class_value) {
    // if new_class_value is passed then the class of the node is setted.
    // Otherwise returns the current class value of the node
    console.error(error_text.replace("XXX", "_tq_class"));
}

BaseStrategy.prototype._tq_add_class = function (node) {
    console.error(error_text.replace("XXX", "_tq_add_class"));
}

BaseStrategy.prototype._tq_remove_class = function (node) {
    console.error(error_text.replace("XXX", "_tq_remove_class"));
}

BaseStrategy.prototype._tq_has_class = function (node) {
    console.error(error_text.replace("XXX", "_tq_has_class"));
}

BaseStrategy.prototype._tq_map_attr = function (node, new_attrs_value) {
    console.error(error_text.replace("XXX", "_tq_map_attr"));
}

BaseStrategy.prototype._tq_get_attr = function (node, key) {
    console.error(error_text.replace("XXX", "_tq_get_attr"));
}

BaseStrategy.prototype._tq_set_attr = function (node, key, value) {
    console.error(error_text.replace("XXX", "_tq_set_attr"));
}

BaseStrategy.prototype._tq_remove_attr = function (node, key) {
    console.error(error_text.replace("XXX", "_tq_remove_attr"));
}

BaseStrategy.prototype._tq_children = function (node) {
    console.error(error_text.replace("XXX", "_tq_children"));
}

BaseStrategy.prototype._tq_remove = function (node) {
    console.error(error_text.replace("XXX", "_tq_remove"));
}

BaseStrategy.prototype._tq_add_child = function (node) {
    console.error(error_text.replace("XXX", "_tq_add_child"));
}


BaseStrategy.prototype._tq_remove_child = function (node) {
    console.error(error_text.replace("XXX", "_tq_remove_child"));
}

BaseStrategy.prototype._tq_clone = function (node) {
    console.error(error_text.replace("XXX", "_tq_clone"));
}

BaseStrategy.prototype._tq_parent = function (node, current_parent) {
    // if current_parent is passed then the parent is seted to this obj
    // Otherwise returns the current node's parent (if any) 
    console.error(error_text.replace("XXX", "_tq_parent"));
}

BaseStrategy.prototype._tq_tag_name = function (node) {
    // returns the tag name of the node
    console.error(error_text.replace("XXX", "_tq_tag_name"));
}

BaseStrategy.prototype._tq_id = function (node, new_id) {
    // if new_id is passed then the node's id is seted.
    // Otherwise returns the current node's id
    console.error(error_text.replace("XXX", "_tq_id"));
};

// ----------------------------------------------
;TreeQuery._tq_register_stratgy("html-element", {
    _tq_accepts: function (node) {
        // reorna true si el node es del tipo que implementa esta estrategia
        return node instanceof HTMLElement;
    },
    _tq_parse: function (str) {
        try {
            var div = document.createElement('div');
            div.innerHTML = str;
            var children = Array.prototype.map.call(div.childNodes, function (n) { return n; });                
            if (children.length == 1 && children[0] instanceof Text) {
                return null;
            }
            return TreeQuery(children);
        } catch(e) {
            return null;
        }
    },
    _tq_class: function (node, new_class_value) {
        // if new_class_value is passed then the class of the node is setted.
        // Otherwise returns the current class value of the node
        console.assert(this._tq_accepts(node), node);
        if (new_class_value) {
            node.className = new_class_value;
            return this;
        };
        return node.className.split(" ");
    },
    _tq_add_class: function (node, classname) {
        console.assert(this._tq_accepts(node), node);            
        node.className += " " + classname;
        return this;
    },
    _tq_remove_class: function (node, classname) {
        console.assert(this._tq_accepts(node), node);            
        node.className = node.className.replace(new RegExp("(?:^|\\s)" + classname +  "(?!\\S)", "g"), '' );
        return this;
    },
    _tq_has_class: function (node, classname) {
        console.assert(this._tq_accepts(node), node);            
        var reg = new RegExp("(?:^|\\s)" + classname +  "(?!\\S)");
        return !!node.className.match(reg);
    },
    _tq_get_attr: function (node, key) {
        console.assert(this._tq_accepts(node), node);        
        console.assert(typeof key == "string", arguments);
        return node.getAttribute(key);
    },
    _tq_set_attr: function (node, key, value) {
        console.assert(this._tq_accepts(node), node);        
        console.assert(typeof key == "string", arguments);        
        return node.setAttribute(key, value);
    },
    _tq_map_attr: function (node) {
        console.assert(this._tq_accepts(node), node);            
        var result = {};
        Object.defineProperty(result, 'length', {enumerable: false, value: node.attributes.length});            
        for (var i=0; i<node.attributes.length; i++) {
            result[node.attributes[i].nodeName] = node.attributes[i].nodeValue;
        }
        return result;
    },
    _tq_set_map_attr: function (node, new_attrs_value) {
        console.assert(this._tq_accepts(node), node);            
        for (var i=0; i<node.attributes.length; i++) {
            node.removeAttribute(node.attributes[i].nodeValue);
        }
        for (var prop in new_attrs_value) {                    
            node.setAttribute(prop, new_attrs_value[prop]);
        }
        return this;
    },
    _tq_remove_attr: function (node, key) {
        console.assert(this._tq_accepts(node), node);
        node.removeAttribute(key);
        return this;
    },
    _tq_children: function (node) {
        console.assert(this._tq_accepts(node), node);
        var children = [];
        for (var i in node.childNodes) {
            if (this._tq_accepts(node.childNodes[i])) {
                children.push(node.childNodes[i]);
            }
        }
        return children;                    
    },
    _tq_remove: function (node) {
        console.assert(this._tq_accepts(node), node);
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
        return this;
    },        
    // ---------------------------------------------------------
    _tq_add_child: function (node, child) {
        console.assert(this._tq_accepts(node), node);
        console.assert(this._tq_accepts(child), child);
        if (this._tq_accepts(child)) {                        
            node.appendChild(child);
        }
        return this;
    },
    _tq_remove_child: function (node, child) {
        console.assert(this._tq_accepts(node), node);
        console.assert(this._tq_accepts(child), child);
        if (this._tq_accepts(child)) {                        
            node.removeChild(child);
        }
        return this;
    },
    _tq_parent: function (node, current_parent) {
        // if current_parent is passed then the parent is seted to this obj
        // Otherwise returns the current node's parent (if any) 
        console.assert(this._tq_accepts(node), node);            
        if (current_parent && this._tq_accepts(current_parent)) {                        
            if (node.parentNode != current_parent) {
                node.parentNode.removeChild(node);
                current_parent.appendChild(node);
                console.assert(node.parentNode == current_parent, node, node.parentNode,current_parent);
            }
            return this;
        }
        return node.parentNode;
    },
    _tq_clone: function (node) {
        console.assert(this._tq_accepts(node), node);
        return node.cloneNode(true);
    },
    // ----------------------------------------------------------
    _tq_tag_name: function (node) {
        // returns the tag name of the node
        console.assert(this._tq_accepts(node), node);
        return node.tagName.toLowerCase();
    },
    _tq_id: function (node, new_id) {
        // if new_id is passed then the node's id is seted.
        // Otherwise returns the current node's id
        return new_id ? this._tq_set_attr(node, "id", new_id) : this._tq_get_attr(node, "id");
    },
    _tq_offset: function (node, new_value) {
        if (new_value) {
            node.style.width= new_value;
            return this;
        }
        return node.offsetWidth();
    },
    _tq_width: function (node, new_value) {
        if (new_value) {
            if (typeof new_value == "number") {
                new_value = new_value + "px";
            }
            node.style.width= new_value;
            return this;
        }
        return node.offsetWidth();
    },
    _tq_height: function (node, new_value) {
        if (new_value) {
            if (typeof new_value == "number") {
                new_value = new_value + "px";
            }            
            node.style.height = new_value;
            return this;
        }
        return node.offsetHeight();
    },
});
;TreeQuery._tq_register_stratgy("js-object", {
    accepts: function (node) {
        // reorna true si el node es del tipo que implementa esta estrategia
        return false;
    },
    _tq_class: function (node, new_class_value) {
        // if new_class_value is passed then the class of the node is setted.
        // Otherwise returns the current class value of the node
    },
    _tq_add_class: function (node, classname) {},
    _tq_remove_class: function (node, classname) {},
    _tq_has_class: function (node, classname) {
        console.assert(this._tq_accepts(node), node);
    },

    _tq_set_attr: function (node) {},
    _tq_map_attr: function (new_attrs_value) {
        // if new_attrs_value is passed then the attribute list of the node is replaced.
        // Otherwise returns the current node's attribute list
    },
    _tq_remove_attr: function (node) {},

    _tq_children: function (node) {
    },
    _tq_remove: function (node) {},
    _tq_add_child: function (node) {},
    _tq_remove_child: function (node) {},
    _tq_parent: function (node, current_parent) {
        // if current_parent is passed then the parent is seted to this obj
        // Otherwise returns the current node's parent (if any) 
    },
    _tq_tag_name: function (node) {
        // returns the tag name of the node
    },
    _tq_id: function (node, new_id) {
        // if new_id is passed then the node's id is seted.
        // Otherwise returns the current node's id
    },
});;TreeQuery._tq_register_api("jquery-dom-manage", {
    each: function (callback) {
        var do_break = null;
        for (var i=0; i<this.length; i++) {
            do_break = callback.call(this[i], this[i], i, this);
            if (do_break) break;
        }
        return this;
    },
    offset: function () {
        return {
            top: this[0].offsetTop,
            left: this[0].offsetLeft
        }
    },
    eq: function (index) {
        return this[index];
    },
    is: function (selection) {
        console.assert(false, "TreeQuery.BaseStrategy.is NOT IMPLEMENTED YET");
        return $();
    },
    next: function () {
        // https://api.jquery.com/next/
        // Get the immediately following sibling of each element in the set of matched elements. If a selector is provided, it retrieves the next sibling only if it matches that selector.
        console.assert(false, "TreeQuery.BaseStrategy.next NOT IMPLEMENTED YET");
        return false;
    },
    class: function (new_class_value) {
        return this._tq_strategy._tq_class(this[0], new_class_value);
    },
    addClass: function (classname) {        
        return this.each(function (element,index,self) {
            self._tq_strategy._tq_add_class(element, classname);
        });
    },
    removeClass: function (classname) {
        return this.each(function (element,index,self) {
            self._tq_strategy._tq_remove_class(element, classname);
        });
    },
    hasClass: function (classname) {
        return this._tq_strategy._tq_has_class(this[0], classname);
    },
    attr: function (key, value) {
        
        if (arguments.length == 1 && typeof key == "string") {
            return this._tq_strategy._tq_get_attr(this[0], key);
        }
        
        if (arguments.length == 2 && typeof key == "string" && (typeof value == "string" || typeof value == "number")) {
            return this.each(function (element,index,self) {
                self._tq_strategy._tq_set_attr(element, key, value);
            });            
        }
        
        if (arguments.length == 2 && typeof key == "string" && typeof value == "function") {
            return this.each(function (element,index,self) {
                var value_func = value.apply(element, [index, key]);
                self._tq_strategy._tq_set_attr(element, key, value_func);
            });            
        }        
        
        if (typeof key == "object") {
            var list = key;
            for (var key_i in list) {
                var value_i = list[key_i];                
                this.each(function (element,index,self) {
                    self._tq_strategy._tq_set_attr(element, key_i, value_i);
                });
            }            
        }
        return this;               
    },
    attributes: function (new_attrs_value) {
        if (arguments.length == 0) {
            return this._tq_strategy._tq_map_attr(this[0]);       
        }        
        return this.each(function (element,index,self) {
            self._tq_strategy._tq_set_map_attr(element, new_attrs_value);
        });
    },
    removeAttr: function (key) {
        return this.each(function (element,index,self) {
            self._tq_strategy._tq_remove_attr(element, key);
        });
    },
    children: function (selector) {
        console.assert(!selector || typeof selector == "string", arguments);
        var $selector = null;
        
        if (selector) {
            $selector = TreeQuery(selector);
        }
        var result = [];
        this.each(function (element, index, self) {
            var children = self._tq_strategy._tq_children(element);
            if ($selector) {
                // Esto se podría optimizar haciendo que el motor tenga una forma de chequear que un objeto concreto cumple con un query
                for (var i=0; i<$selector.length; i++) {
                    for (var j=0; j<children.length; j++) {
                        if ($selector[i] == children[j]) {
                            result.push(children[j]);
                        }
                    }
                }
            } else {
                result = result.concat(children);
            }
        });
        return TreeQuery(result);
    },
    remove: function () {
        return this.each(function (element,index,self) {
            self._tq_strategy._tq_remove(element);
        });
    },
    parent: function (selector) {
        console.assert(!selector || typeof selector == "string", arguments);
        var $selector = null;
        
        if (selector) {
            $selector = TreeQuery(selector);
        }
        var result = [];
        this.each(function (element, index, self) {
            var parent = self._tq_strategy._tq_parent(element);
            if ($selector) {
                // Esto se podría optimizar haciendo que el motor tenga una forma de chequear que un objeto concreto cumple con un query
                for (var i=0; i<$selector.length; i++) {
                    if ($selector[i] == parent) {
                        result.push(parent);
                    }
                }
            } else {
                result.push(parent);
            }
        });
        return TreeQuery(result);
    },
    clone: function () {
        var result = [];
        this.each(function (element, index, self) {
            var minime = self._tq_strategy._tq_clone(element);
            result.pus(minime);
        });
        return TreeQuery(result);        
    },
    append: function (target) {
        return this.each(function (element,index,self) {
            if (self._tq_strategy._tq_accepts(target)) {
                self._tq_strategy._tq_add_child(node, target);
            }
            if (target instanceof TreeQuery) {
                for (var i=0; i<target.length; i++) {                    
                    var elem = target[i];
                    console.assert(self._tq_strategy._tq_accepts(elem), elem);
                    if (!isNaN(index) && index!=self.length-1) {
                        elem = self._tq_strategy._tq_clone(elem);
                    }
                    self._tq_strategy._tq_add_child(element, elem);
                }
            }
            if (typeof target == "string") {
                self.append(TreeQuery(target));
            }
        });        
    },
    appendTo: function (content) {
        if (typeof content == "string") {
            content = new TreeQuery(content, this._tqGetDefaultContext());
        }
        
        return this.each(function (element,index,self) {
            if (self._tq_strategy._tq_accepts(content)) {
                self._tq_strategy._tq_add_child(content, element);
            }

            if (content instanceof TreeQuery) {
                for (var i=0; i<content.length; i++) {                    
                    var elem = content[i];
                    console.assert(self._tq_strategy._tq_accepts(elem), elem);
                    if (i==content.length-1) {
                        self._tq_strategy._tq_add_child(elem, element );
                    } else {
                        self._tq_strategy._tq_add_child(elem, self._tq_strategy._tq_clone(element));
                    }
                }                
            }
        });          
        
    },
    // ----------------------------------------------------------
    height: function (new_value) {
        if (new_value) {
            return this.each(function (element,index,self) {
                self._tq_strategy._tq_height(element, new_value);
            });            
        } else {
           return this._tq_strategy._tq_height(element);
        }
    },
    width: function (new_value) {
        if (new_value) {
            return this.each(function (element,index,self) {
                self._tq_strategy._tq_width(element, new_value);
            });            
        } else {
           return this._tq_strategy._tq_width(element);
        }
    },
    
});;
    if ( typeof define === "function" && define.amd ) {
        define(function () {return TreeQuery; } );
    } else {
        window.$ = TreeQuery;
        window.TreeQuery = TreeQuery;
    }

})();