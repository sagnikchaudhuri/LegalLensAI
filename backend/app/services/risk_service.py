def calculate_risk(text: str, clause_types: set[str]) -> tuple[int, list[str], list[str]]:
    lowered = text.lower()
    score = 0
    red_flags: list[str] = []
    missing: list[str] = []

    missing_rules = [
        ("Payment", 15, "Payment terms are not clearly stated."),
        ("Termination", 20, "No clear termination process was found."),
        ("Dispute Resolution", 10, "The agreement does not explain how disputes will be resolved."),
        ("Confidentiality", 8, "Confidentiality protections appear to be missing."),
        ("Intellectual Property", 15, "Intellectual property ownership is unclear."),
    ]
    for clause, points, message in missing_rules:
        if clause not in clause_types:
            score += points
            missing.append(message)

    risky_rules = [
        (["sole discretion", "without notice"], 15, "A party may have unilateral termination power."),
        (["unlimited liability", "without limitation"], 20, "Liability may be unlimited or insufficiently capped."),
        (["non-compete", "noncompete"], 15, "The document contains a potentially restrictive non-compete."),
        (["liquidated damages", "penalty"], 15, "A penalty or liquidated damages clause may be burdensome."),
    ]
    for keywords, points, message in risky_rules:
        if any(keyword in lowered for keyword in keywords):
            score += points
            red_flags.append(message)

    if "Deliverables" not in clause_types and "Scope of Work" in clause_types:
        score += 10
        red_flags.append("Deliverables may be vague or insufficiently measurable.")

    return min(score, 100), red_flags, missing


def risk_level(score: int) -> str:
    if score <= 35:
        return "Low Risk"
    if score <= 70:
        return "Medium Risk"
    return "High Risk"


def negotiation_suggestions(red_flags: list[str], missing: list[str]) -> list[str]:
    suggestions = []
    combined = " ".join(red_flags + missing).lower()
    if "termination" in combined:
        suggestions.append("Request mutual termination rights and a reasonable written notice period.")
    if "liability" in combined:
        suggestions.append("Propose a liability cap tied to fees paid under the agreement.")
    if "payment" in combined:
        suggestions.append("Add payment due dates, invoice terms, and a process for disputed charges.")
    if "intellectual property" in combined:
        suggestions.append("Clarify ownership of pre-existing IP and newly created work product.")
    if "dispute" in combined:
        suggestions.append("Agree on a practical dispute process, venue, and governing law.")
    if "confidential" in combined:
        suggestions.append("Add mutual confidentiality duties with standard exclusions.")
    if not suggestions:
        suggestions.append("Confirm that key obligations, deadlines, and remedies are mutual and measurable.")
    return suggestions

