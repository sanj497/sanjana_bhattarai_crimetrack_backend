import EmergencyContact from "../Models/Emergencycontact.js";

// GET all active emergency contacts
export const getAllContacts = async (req, res) => {
  try {
    const { category, region } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (region) filter.region = new RegExp(region, "i");

    const contacts = await EmergencyContact.find(filter).sort({
      category: 1,
      name: 1,
    });

    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single contact by ID
export const getContactById = async (req, res) => {
  try {
    const contact = await EmergencyContact.findById(req.params.id);

    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }

    res.status(200).json({ success: true, data: contact });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST create new emergency contact
export const createContact = async (req, res) => {
  try {
    const contact = await EmergencyContact.create(req.body);

    res.status(201).json({ success: true, data: contact });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT update a contact
export const updateContact = async (req, res) => {
  try {
    const contact = await EmergencyContact.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }

    res.status(200).json({ success: true, data: contact });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE a contact
export const deleteContact = async (req, res) => {
  try {
    const contact = await EmergencyContact.findByIdAndDelete(
      req.params.id
    );

    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }

    res.status(200).json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST seed default Nepal emergency contacts
export const seedDefaultContacts = async (req, res) => {
  try {
    const defaults = [
      {
        name: "Nepal Police",
        number: "100",
        category: "police",
        description: "National police emergency",
        region: "National",
      },
      {
        name: "Armed Police Force",
        number: "101",
        category: "police",
        description: "Armed police helpline",
        region: "National",
      },
      {
        name: "Fire Brigade",
        number: "101",
        category: "fire",
        description: "Fire emergency service",
        region: "National",
      },
      {
        name: "Ambulance / Medical Emergency",
        number: "102",
        category: "medical",
        description: "National ambulance service",
        region: "National",
      },
      {
        name: "Women & Children Office",
        number: "1145",
        category: "women",
        description: "Violence against women helpline",
        region: "National",
      },
      {
        name: "Child Helpline",
        number: "1098",
        category: "child",
        description: "Child protection helpline",
        region: "National",
      },
      {
        name: "Disaster Risk Reduction",
        number: "1155",
        category: "disaster",
        description: "Natural disaster response",
        region: "National",
      },
    ];

    await EmergencyContact.deleteMany({ region: "National" });

    const inserted = await EmergencyContact.insertMany(defaults);

    res.status(201).json({
      success: true,
      count: inserted.length,
      data: inserted,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};