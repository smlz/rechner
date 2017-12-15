/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "_" }] */
/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/* global Vue */

(function() {
    "use strict";

    // ============================================= //
    // tokenize: Eingabe in logisch Blöcke aufteilen //
    // ============================================= //
    function tokenize(text) {
        return text
        .replace(/\(/g, " ( ")
        .replace(/\)/g, " ) ")
        .replace(/\n/g, " ")
        .split(" ")
        .filter(Boolean);
    }

    // ====================================== //
    // parse: Struktur des Programms auslesen //
    // ====================================== //
    function parse(tokens) {
        if (tokens.length === 0) {
            throw SyntaxError("Unexpected end of program while reading");
        }
        var token = tokens.shift();
        if (token === "(") {
            var list = [];
            while (tokens[0] !== ")") {
                list.push(parse(tokens));
            }
            tokens.shift();
            return list;
        } else if (token === ")") {
            throw SyntaxError("Unexpected )");
        } else {
            var number = parseFloat(token);
            if (isNaN(number)) {
                return token;
            } else {
                return number;
            }
        }
    }

    // ================================= //
    // environment: Funktionen und Werte//
    // ================================= //
    const environment = {
        "+": function(a, b) { return a + b; },
        "-": function(a, b) {
            if (b === undefined) {
                return -a
            } else {
                return a - b;
            }
        },
        "*": function(a, b) { return a * b; },
        "/": function(a, b) { return a / b; },

    };

    // ===================================== //
    // evaluate: Eine Rechnung 'x' auswerten //
    // ===================================== //
    function evaluate(x) {
        if (typeof x === "number") {   // Eine nackte Zahl
            return x;
        } else if (typeof x === "string") {  // Ein Name einer Variable
            return environment[x];
        } else if (x instanceof Array) {    // Eine Rechnung

            // Das erste Element ist der Name der Operation
            var func_name = x[0];

            // ============= //
            // Special Forms //
            // ============= //
            if (func_name === 'begin') {
                var result;
                for (var i=1; i < x.length; i++) {
                    // Alle Rechnungen der Reihe nach auswerten
                    result = evaluate(x[i]);
                }
                // Das letzte Resultat zurück geben
                return result;

            } else if (func_name == 'define') {
                // Name der Variable
                var var_name = x[1];

                // Evaluiere den Wert der Variable
                var value = evaluate(x[2]);

                // Wert in der Tabelle der Variablen abspeichern
                environment[var_name] = value;
            } else if (func_name === 'lambda') {
                return x;
            } else {
                // ================== //
                // 'Normale' Funktion //
                // ================== //

                // Finde die Funktion in der Liste der Funktionen
                var func = environment[func_name];

                // Evaluiere die Argumente der Funktion
                var args = [];
                for (var i=1; i < x.length; i++) {
                    args.push(evaluate(x[i]))
                }

                if (func instanceof Array) {  // Selbst definierte Funktion
                    // func[0]=== 'lambda'
                    var arg_names = func[1];
                    var body = func[2];
                    if (arg_names.length === 1) {
                        environment[arg_names[0]] = args[0];
                    }
                    return evaluate(body);
                } else {   // Eingebaute Funktion
                    // Führe die Funktion mit den verbleibenden Argumenten aus
                    return func(...args);
                }
            }
        } else {
            throw new Error("Kann Rechnung nicht interpretieren: " + x)
        }
    }



    // ======================================== //
    // vue.js Code zur Darstellung              //
    // ======================================== //
    Vue.component("item", {
        template: "#item-template",
        props: ["model"],
        computed: {
            isList: function() {
                return this.model instanceof Array;
            },
        },
    });

    const vm = new Vue({
        el: "#app",
        data: {
            input: "",
            tokens: [],
            syntax_tree: [],
            environment: environment,
            result: undefined,
            error: false,
            debug: true
        },
        watch: {
            // Updated alle Daten, wenn der 'input' ändert
            input: function(val) {
                this.ast = [];
                this.result = undefined;
                this.error = false;
                try {
                    this.tokens = tokenize(val);
                    this.syntax_tree = parse(this.tokens.slice());
                    let result = evaluate(this.syntax_tree);
                    if (result instanceof Array) {
                        const pprint = tree => tree instanceof Array ?
                        "(" + tree.map(pprint).join(" ") + ")" : tree;
                        this.result = pprint(result.slice(0, -1));
                    } else if (typeof result === "function") {
                        this.result = "native function: " + result.name;
                    } else {
                        this.result = result;
                    }
                } catch (error) {
                    this.error = error;
                }
            }
        },
    });

    // Example input:
    vm.input = `1`;
}());
