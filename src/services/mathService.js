import { evaluate, format, derivative } from 'mathjs';
import nerdamer from 'nerdamer';
// Load nerdamer addons
require('nerdamer/Algebra');
require('nerdamer/Calculus');
require('nerdamer/Solve');

export function solveMathDeterministically(expression) {
  try {
    const cleanExpr = expression.replace(/\s+/g, "").toLowerCase();
    const steps = [];
    let finalAnswer = "";

    // 1. Check for basic derivative: d/dx(...)
    const diffMatch = cleanExpr.match(/d\/dx\((.*)\)/) || cleanExpr.match(/derivativeof(.*)/);
    if (diffMatch) {
      steps.push(`Identified derivative calculation for: ${diffMatch[1]}`);
      const res = nerdamer(`diff(${diffMatch[1]}, x)`).text();
      steps.push(`Applied differentiation rules.`);
      finalAnswer = res;
      return { steps, finalAnswer, type: "Calculus", requiresAI: false };
    }

    // 2. Check for equations (Linear / Quadratics)
    if (cleanExpr.includes('=')) {
      steps.push(`Identified equation: ${expression}`);
      try {
        // Try solving for x deterministically
        const sol = nerdamer.solve(cleanExpr, 'x').text();
        steps.push(`Isolated variable x using algebraic rules.`);
        finalAnswer = `x = ${sol}`;
        return { steps, finalAnswer, type: "Algebra", requiresAI: false };
      } catch (eqErr) {
        return { steps: ["Equation detected. Applying AI solver as fallback."], finalAnswer: null, type: "Algebra", requiresAI: true };
      }
    }

    // 3. Basic Arithmetic, Fractions, Trigonometry, Statistics
    steps.push(`Evaluating mathematical expression: ${expression}`);
    let evalExpr = expression
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/π/g, "pi")
      .replace(/√/g, "sqrt");
      
    try {
      const ans = evaluate(evalExpr);
      finalAnswer = format(ans, { precision: 14 });
      steps.push(`Calculation complete.`);
      return { steps, finalAnswer, type: "Arithmetic", requiresAI: false };
    } catch (arithErr) {
      // Fallback to nerdamer for simplification if mathjs fails (e.g. algebraic simplify)
      const simplified = nerdamer(evalExpr).text();
      finalAnswer = simplified;
      steps.push(`Simplified expression.`);
      return { steps, finalAnswer, type: "Algebra", requiresAI: false };
    }

  } catch (err) {
    console.log("Deterministic Math Error:", err);
    return { steps: [], finalAnswer: null, type: "Unknown", requiresAI: true };
  }
}
