// Import stylesheets
import './style.css';

(() => {
  function utils__createInput(type) {
    const input = document.createElement('input');
    input.type = type;
    input.placeholder = '0';
    return input;
  }

  function utils__createSubOutput(text) {
    const initial = document.createElement('div');
    initial.textContent = text;
    return initial;
  }

  function utils__createOutput() {
    const output = document.createElement('div');
    output.classList.add('output');
    return output;
  }

  function utils__setSelectionRange() {
    this.focus();
    const length = this.value.length + 1;
    this.setSelectionRange(length, length);
  }

  class Calculator extends HTMLElement {
    constructor() {
      super();
      this.input = utils__createInput('text');
      this.input.addEventListener.call(this, 'input', this._handleInput);

      this.input.addEventListener('click', function (_event) {
        _event.preventDefault();
        if (!this.value.length) return;
        utils__setSelectionRange.call(this);
      });
      this.input.addEventListener('keydown', function (_event) {
        if (_event.key === ' ') {
          _event.preventDefault();
        }
        if (_event.key !== 'ArrowLeft' && _event.key !== 'ArrowRight') return;
        utils__setSelectionRange.call(this);
      });
      this.output = utils__createOutput();
      this.append(this.input, this.output);
    }

    _operatorsPriorityMap = {
      '*': (a, b) => +a * +b,
      '/': (a, b) => +a / +b,
      '^': (a, b) => Math.pow(+a, +b),
      '+': (a, b) => +a + +b,
      '-': (a, b) => +a - +b,
      '%': (a, b) => +a % +b,
    };

    get currentExpression() {
      return this.input.value;
    }

    _isNumber(char) {
      return !isNaN(+char);
    }

    _isOperator(char) {
      return '+-*/()%^.'.includes(char);
    }

    _calculateWith(operator, ...args) {
      return args.reduce(this._operatorsPriorityMap[operator]);
    }

    _parseExpressionToExpressionArray(expression) {
      const result = [];
      let nums = 0;
      try {
        for (let char of expression) {
          if (!this._isNumber(char) && !this._isOperator(char)) {
            this.input.value = expression.substring(0, expression.length - 2);
            throw new TypeError(
              `Unexpected token ${char} in "${expression}" expression.`
            );
          }
          if (this._isNumber(char) || char == '-' || char == '.') {
            result[nums] ? (result[nums] += char) : (result[nums] = char);
            continue;
          }
          nums = result.length + 1;
          result.push(char);
        }
        return result;
      } catch (err) {
        this._handleErrors(err.message);
      }
    }

    _separateByBrackets(expressionArray) {
      const brackets = [];

      try {
        for (let i = 0; i < expressionArray.length; i++) {
          const elem = expressionArray[i];
          if (elem == '(') brackets.push([elem, i]);
          if (elem == ')') {
            if (brackets.length === 0)
              throw new TypeError(
                `Invalid closing brackets expression at ${i} position in ${this.currentExpression}.`
              );
            let lastIndex = brackets[brackets.length - 1][1];

            let insideBrackets = expressionArray.splice(
              lastIndex,
              i - lastIndex + 1
            );

            insideBrackets = insideBrackets.splice(
              1,
              insideBrackets.length - 2
            );

            expressionArray.splice(
              lastIndex,
              0,
              ...this._calculateBracketlessExpression(insideBrackets)
            );

            expressionArray = this._separateByBrackets(expressionArray);

            brackets.pop();
          }
        }

        return expressionArray;
      } catch (err) {
        this._handleErrors(err);
      }
    }

    _calculateBracketlessExpression(expressionArray) {
      for (let operator in this._operatorsPriorityMap) {
        if (this._isOperator(expressionArray[expressionArray.length - 1]))
          return expressionArray;

        let i = -1;
        while ((i = expressionArray.indexOf(operator)) != -1) {
          const [a, b] = [expressionArray[i - 1], expressionArray[i + 1]];
          if (this._isOperator(a) || this._isOperator(b))
            return expressionArray;
          expressionArray.splice(i - 1, 3, this._calculateWith(operator, a, b));
        }
      }
      return expressionArray;
    }

    _handleErrors(err) {
      const message = `${err.name}: ${err.message}`;
      console.warn(message);
      this.input.classList.add('error');
    }

    _handleInput(_event) {
      this.input.classList.remove('error');

      let arrayExpression = this._parseExpressionToExpressionArray(
        this.currentExpression
      );

      if (!arrayExpression) return;
      if (!this._isNumber(arrayExpression[0]) && arrayExpression.length == 1)
        return;

      arrayExpression = this._separateByBrackets(arrayExpression);

      if (!arrayExpression) return;
      arrayExpression = this._calculateBracketlessExpression(arrayExpression);

      if (
        (arrayExpression.length >= 2 && this._isOperator(arrayExpression[0])) ||
        this._isOperator(arrayExpression[arrayExpression.length - 1])
      )
        return;

      let [result] = arrayExpression;
      if (!this._isNumber(result)) return;

      if (result > Number.MAX_SAFE_INTEGER) {
        result = '> ' + Number.MAX_SAFE_INTEGER;
      }

      this.output.prepend(utils__createSubOutput(result));

      if (this.output.children.length >= 7) this.output.lastChild.remove();
    }
  }

  try {
    customElements.define('app-calculator', Calculator);
  } catch (err) {
    console.warn(err.message);
  }
})();
