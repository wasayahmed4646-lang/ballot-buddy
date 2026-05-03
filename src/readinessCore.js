(function initReadinessCore(root) {
  function calculateReadiness(input) {
    const age = Number(input?.age);
    const registered = input?.registered || "unsure";
    const hasId = input?.hasId || "unsure";
    const boothKnown = input?.boothKnown || "no";

    if (!Number.isInteger(age) || age < 1 || age > 120) {
      const error = new Error("Enter a valid age between 1 and 120.");
      error.statusCode = 400;
      throw error;
    }

    let score = 100;
    const actions = [];

    if (age < 18) {
      score = 20;
      actions.push("You are not eligible yet. Prepare documents and learn the registration process before turning 18.");
    }

    if (age >= 18 && registered !== "yes") {
      score -= registered === "no" ? 35 : 25;
      actions.push("Confirm your name on the electoral roll or complete registration through the official voter services portal.");
    }

    if (age >= 18 && hasId !== "yes") {
      score -= hasId === "no" ? 25 : 15;
      actions.push("Check the accepted photo ID list for your region and arrange a valid document.");
    }

    if (age >= 18 && boothKnown !== "yes") {
      score -= 15;
      actions.push("Verify your polling booth close to election day using official election authority tools.");
    }

    if (!actions.length) {
      actions.push("You look ready. Recheck booth details and accepted documents before polling day.");
    }

    const boundedScore = Math.max(0, Math.min(100, score));
    const level = boundedScore >= 85 ? "Ready" : boundedScore >= 55 ? "Almost ready" : "Needs attention";

    return {
      score: boundedScore,
      level,
      actions
    };
  }

  const api = { calculateReadiness };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.VoteSetuReadiness = api;
}(typeof globalThis !== "undefined" ? globalThis : window));
