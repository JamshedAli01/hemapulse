# Blood compatibility service
# Donor blood group → list of recipient blood groups that can receive

COMPATIBILITY = {
    "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    "O+": ["O+", "A+", "B+", "AB+"],
    "A-": ["A-", "A+", "AB-", "AB+"],
    "A+": ["A+", "AB+"],
    "B-": ["B-", "B+", "AB-", "AB+"],
    "B+": ["B+", "AB+"],
    "AB-": ["AB-", "AB+"],
    "AB+": ["AB+"],
}


def can_donate(donor_blood_group: str, recipient_blood_group: str) -> bool:
    """Returns True if donor can donate to the recipient blood group."""
    return recipient_blood_group in COMPATIBILITY.get(donor_blood_group, [])


def compatible_donor_groups(recipient_blood_group: str) -> list[str]:
    """Returns list of donor blood groups that can donate to the recipient."""
    return [
        donor
        for donor, recipients in COMPATIBILITY.items()
        if recipient_blood_group in recipients
    ]
