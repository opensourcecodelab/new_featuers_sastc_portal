/**
 * Agriculture (AG) Department Academic Resources Data (SASTC Portal)
 *
 * Instructions for adding/updating resources:
 * - Provide your exact image URL in `thumbnail` (Direct image link or Google Drive image link).
 * - Provide your exact document link in `url` (Google Drive file/folder link or direct PDF link).
 * - Supported categories:
 *   "Question Bank" | "Lecture Notes" | "Reference Books" | "Lab Materials" | "Previous Questions" | "More"
 * - Levels: "1", "2", "3", "4"
 * - Semesters: "1", "2"
 */

export const agResourceData = {
  "1": {
    "1": [
      {
        id: "ag-agn101-ln-1",
        courseCode: "AGN 101",
        courseTitle: "Fundamentals of Agronomy",
        title: "Fundamentals of Agronomy Complete Lecture Notes",
        category: "Lecture Notes",
        level: "1",
        semester: "1",
        fileType: "PDF",
        tags: ["AGN 101", "AG 101", "Agronomy", "Tillage", "Seeds", "Lecture Notes", "L1S1"],
        thumbnail: "",
        url: "",
        details: "Comprehensive lecture notes on agro-climatic zones, tillage practices, seed quality, sowing methods, and weed management.",
        author: "Dept. of Agronomy",
        pages: "",
        size: "",
        session: "L1 S1"
      },
      {
        id: "ag-ssc101-qb-1",
        courseCode: "SSC 101",
        courseTitle: "Introductory Soil Science",
        title: "SSC 101 Soil Science Question Bank & Short Notes",
        category: "Question Bank",
        level: "1",
        semester: "1",
        fileType: "PDF",
        tags: ["SSC 101", "Soil Science", "Soil Profile", "Question Bank", "L1S1"],
        thumbnail: "",
        url: "",
        details: "Topic-wise solved questions on soil formation, soil physical properties, soil texture, structure, and soil moisture.",
        author: "Dept. of Soil Science",
        pages: "",
        size: "",
        session: "L1 S1"
      },
      {
        id: "ag-ach101-ref-1",
        courseCode: "ACH 101",
        courseTitle: "Agricultural Chemistry",
        title: "ACH 101 & BMB 101 Reference Book & Analytical Guide",
        category: "Reference Books",
        level: "1",
        semester: "1",
        fileType: "PDF",
        tags: ["ACH 101", "BMB 101", "Biochemistry", "Agricultural Chemistry", "Reference Books"],
        thumbnail: "",
        url: "",
        details: "Core reference guide for physical and analytical chemistry, biomolecules, enzymes, and plant metabolism.",
        author: "Faculty of Agriculture",
        pages: "",
        size: "",
        session: "L1 S1"
      },
      {
        id: "ag-l1s1-lab-1",
        courseCode: "AG 102",
        courseTitle: "Agronomy & Soil Science Sessional",
        title: "Level 1 Semester 1 Practical Notebook & Identification Guide",
        category: "Lab Materials",
        level: "1",
        semester: "1",
        fileType: "PDF",
        tags: ["AG 102", "AGN 102", "SSC 102", "Lab Materials", "Practical", "Seed Identification"],
        thumbnail: "",
        url: "",
        details: "Crop seed identification chart, fertilizer calculation formulas, soil texture determination lab procedures, and viva guide.",
        author: "Faculty of Agriculture",
        pages: "",
        size: "",
        session: "L1 S1"
      },
      {
        id: "ag-l1s1-pq-1",
        courseCode: "AGF 101",
        courseTitle: "Agroforestry, AIE 101 & SOC 101",
        title: "B.Sc. Ag Level 1 Semester 1 Previous Final Exam Questions",
        category: "Previous Questions",
        level: "1",
        semester: "1",
        fileType: "PDF",
        tags: ["ACH 101", "BMB 101", "AIE 101", "SOC 101", "SSC 101", "AGF 101", "AGN 101", "Previous Questions"],
        thumbnail: "",
        url: "",
        details: "Compiled previous years' semester final question papers for all Level 1 Semester 1 Agriculture courses.",
        author: "SASTC Ag Archive",
        pages: "",
        size: "",
        session: "Previous Batches"
      },
      {
        id: "ag-l1s1-more-1",
        courseCode: "AIE 101",
        courseTitle: "Agricultural Engineering & Syllabus",
        title: "B.Sc. in Agriculture Full Curriculum & Scientific Names Sheet",
        category: "More",
        level: "1",
        semester: "1",
        fileType: "PDF",
        tags: ["AIE 101", "Syllabus", "Scientific Names", "More", "Agriculture"],
        thumbnail: "",
        url: "",
        details: "Complete list of scientific names, family names, chromosome numbers of major field crops, and syllabus outline.",
        author: "SASTC Agriculture",
        pages: "",
        size: "",
        session: "All Batches"
      }
    ],
    "2": [
      {
        id: "ag-cpe103-ln-1",
        courseCode: "CPE 103",
        courseTitle: "Crop Botany",
        title: "Crop Botany (CPE 103 / AG 151) Complete Lecture Notes",
        category: "Lecture Notes",
        level: "1",
        semester: "2",
        fileType: "PDF",
        tags: ["CPE 103", "AG 151", "Crop Botany", "Plant Morphology", "Taxonomy", "Lecture Notes"],
        thumbnail: "",
        url: "",
        details: "Plant morphology, anatomy, cell division, reproductive biology, and taxonomic characteristics of major crop families.",
        author: "Dept. of Crop Botany",
        pages: "",
        size: "",
        session: "L1 S2"
      },
      {
        id: "ag-ent101-qb-1",
        courseCode: "ENT 101",
        courseTitle: "Introductory Entomology",
        title: "ENT 101 Insect Morphology, Classification & Question Bank",
        category: "Question Bank",
        level: "1",
        semester: "2",
        fileType: "PDF",
        tags: ["ENT 101", "Entomology", "Insect Orders", "Question Bank", "L1S2"],
        thumbnail: "",
        url: "",
        details: "Solved questions on insect head/thorax/abdomen modifications, metamorphosis, digestive systems, and taxonomic orders.",
        author: "Dept. of Entomology",
        pages: "",
        size: "",
        session: "L1 S2"
      },
      {
        id: "ag-plp101-ln-1",
        courseCode: "PLP 101",
        courseTitle: "Fundamentals of Plant Pathology",
        title: "PLP 101 & HRT 101 Plant Pathology and Horticulture Notes",
        category: "Lecture Notes",
        level: "1",
        semester: "2",
        fileType: "PDF",
        tags: ["PLP 101", "HRT 101", "GPB 101", "AED 101", "ACH 103", "Plant Pathology", "Horticulture"],
        thumbnail: "",
        url: "",
        details: "Plant disease symptoms, fungi/bacteria/virus pathogens, propagation techniques, and horticultural nursery management.",
        author: "Faculty of Agriculture",
        pages: "",
        size: "",
        session: "L1 S2"
      },
      {
        id: "ag-l1s2-pq-1",
        courseCode: "GPB 101",
        courseTitle: "Genetics & All L1S2 Courses",
        title: "B.Sc. Ag Level 1 Semester 2 Previous Final Question Papers",
        category: "Previous Questions",
        level: "1",
        semester: "2",
        fileType: "PDF",
        tags: ["AED 101", "GPB 101", "ACH 103", "ENT 101", "CPE 103", "PLP 101", "HRT 101", "Previous Questions"],
        thumbnail: "",
        url: "",
        details: "Past final examination question papers for AED 101, GPB 101, ACH 103, ENT 101, CPE 103, PLP 101, and HRT 101.",
        author: "SASTC Ag Archive",
        pages: "",
        size: "",
        session: "Previous Batches"
      }
    ]
  },
  "2": {
    "1": [
      {
        id: "ag-201-ln-1",
        courseCode: "AG 201",
        courseTitle: "Cytogenetics & Genetics",
        title: "Genetics & Cytogenetics Complete Lecture Notes",
        category: "Lecture Notes",
        level: "2",
        semester: "1",
        fileType: "PDF",
        tags: ["AG 201", "GPB 201", "Genetics", "Mendelian", "Linkage", "Lecture Notes"],
        thumbnail: "",
        url: "",
        details: "Mendelian genetics, gene interaction, linkage and crossing over, chromosomal aberrations, and DNA replication.",
        author: "Dept. of GPB",
        pages: "",
        size: "",
        session: "L2 S1"
      },
      {
        id: "ag-ent201-qb-1",
        courseCode: "ENT 201",
        courseTitle: "Insect Ecology & Pest Management",
        title: "ENT 201 IPM & Economic Entomology Question Bank",
        category: "Question Bank",
        level: "2",
        semester: "1",
        fileType: "PDF",
        tags: ["ENT 201", "Entomology", "IPM", "Pest Management", "Question Bank"],
        thumbnail: "",
        url: "",
        details: "Integrated Pest Management (IPM), economic threshold levels, biological control, and major crop pests.",
        author: "Dept. of Entomology",
        pages: "",
        size: "",
        session: "L2 S1"
      },
      {
        id: "ag-202-lab-1",
        courseCode: "AG 202",
        courseTitle: "Genetics & Entomology Sessional",
        title: "Level 2 Semester 1 Practical Manual & Mitosis/Meiosis Slides",
        category: "Lab Materials",
        level: "2",
        semester: "1",
        fileType: "PDF",
        tags: ["AG 202", "Lab Materials", "Cytology", "Chi-Square", "Practical"],
        thumbnail: "",
        url: "",
        details: "Slide preparation for mitosis and meiosis, Chi-square genetic ratio problems, and insect pest specimen identification.",
        author: "Faculty of Agriculture",
        pages: "",
        size: "",
        session: "L2 S1"
      }
    ],
    "2": [
      {
        id: "ag-251-ln-1",
        courseCode: "AG 251",
        courseTitle: "Plant Breeding",
        title: "Plant Breeding Methods, Hybridization & Heterosis Notes",
        category: "Lecture Notes",
        level: "2",
        semester: "2",
        fileType: "PDF",
        tags: ["AG 251", "GPB 251", "Plant Breeding", "Heterosis", "Mutation Breeding", "Lecture Notes"],
        thumbnail: "",
        url: "",
        details: "Breeding self- and cross-pollinated crops, mass/pureline/pedigree selection, backcross, heterosis, and polyploidy.",
        author: "Dept. of GPB",
        pages: "",
        size: "",
        session: "L2 S2"
      },
      {
        id: "ag-plp251-qb-1",
        courseCode: "PLP 251",
        courseTitle: "Plant Pathology & Field Crop Diseases",
        title: "PLP 251 Diseases of Field Crops Question Bank",
        category: "Question Bank",
        level: "2",
        semester: "2",
        fileType: "PDF",
        tags: ["PLP 251", "Plant Pathology", "Rice Diseases", "Wheat Diseases", "Question Bank"],
        thumbnail: "",
        url: "",
        details: "Etiology, disease cycle, epidemiology, and management of major diseases of rice, wheat, jute, sugarcane, and pulses.",
        author: "Dept. of Plant Pathology",
        pages: "",
        size: "",
        session: "L2 S2"
      }
    ]
  },
  "3": {
    "1": [
      {
        id: "ag-301-ln-1",
        courseCode: "AG 301",
        courseTitle: "Horticulture (Olericulture & Pomology)",
        title: "Vegetable & Fruit Production Technology Complete Notes",
        category: "Lecture Notes",
        level: "3",
        semester: "1",
        fileType: "PDF",
        tags: ["AG 301", "HRT 301", "Horticulture", "Vegetables", "Pomology", "Lecture Notes"],
        thumbnail: "",
        url: "",
        details: "Scientific cultivation practices, varieties, pruning, and post-harvest technology of major vegetables and fruits.",
        author: "Dept. of Horticulture",
        pages: "",
        size: "",
        session: "L3 S1"
      },
      {
        id: "ag-aex301-qb-1",
        courseCode: "AEX 301",
        courseTitle: "Agricultural Extension Education",
        title: "AEX 301 Extension Teaching Methods & Communication Question Bank",
        category: "Question Bank",
        level: "3",
        semester: "1",
        fileType: "PDF",
        tags: ["AEX 301", "Agricultural Extension", "Diffusion", "Communication", "Question Bank"],
        thumbnail: "",
        url: "",
        details: "Extension program planning, diffusion of innovations, adoption stages, and rural leadership notes.",
        author: "Dept. of Agricultural Extension",
        pages: "",
        size: "",
        session: "L3 S1"
      }
    ],
    "2": [
      {
        id: "ag-351-ln-1",
        courseCode: "AG 351",
        courseTitle: "Crop Physiology",
        title: "Crop Physiology Photosynthesis, Respiration & Plant Hormones Notes",
        category: "Lecture Notes",
        level: "3",
        semester: "2",
        fileType: "PDF",
        tags: ["AG 351", "Crop Physiology", "C3 C4 CAM", "Photoperiodism", "Lecture Notes"],
        thumbnail: "",
        url: "",
        details: "Plant water relations, mineral nutrition, C3/C4/CAM pathways, translocation, plant growth regulators, and stress physiology.",
        author: "Dept. of Crop Botany",
        pages: "",
        size: "",
        session: "L3 S2"
      },
      {
        id: "ag-aec351-qb-1",
        courseCode: "AEC 351",
        courseTitle: "Agricultural Economics & Farm Management",
        title: "AEC 351 Farm Management & Agricultural Marketing Question Bank",
        category: "Question Bank",
        level: "3",
        semester: "2",
        fileType: "PDF",
        tags: ["AEC 351", "Agricultural Economics", "Farm Budgeting", "Question Bank"],
        thumbnail: "",
        url: "",
        details: "Production economics, cost concepts, farm budgeting, agricultural credit, and marketing efficiency.",
        author: "Dept. of Ag. Economics",
        pages: "",
        size: "",
        session: "L3 S2"
      }
    ]
  },
  "4": {
    "1": [
      {
        id: "ag-401-ln-1",
        courseCode: "AG 401",
        courseTitle: "Seed Science and Technology",
        title: "Seed Production, Certification & Storage Technology Notes",
        category: "Lecture Notes",
        level: "4",
        semester: "1",
        fileType: "PDF",
        tags: ["AG 401", "Seed Technology", "Seed Certification", "Viability", "Lecture Notes"],
        thumbnail: "",
        url: "",
        details: "Classes of seed, isolation distance, seed certification standards, germination testing, and seed legislation.",
        author: "Dept. of Agronomy",
        pages: "",
        size: "",
        session: "L4 S1"
      }
    ],
    "2": [
      {
        id: "ag-451-ln-1",
        courseCode: "AG 451",
        courseTitle: "Agroforestry & Environmental Science",
        title: "Agroforestry Systems, Climate Change & Silviculture Notes",
        category: "Lecture Notes",
        level: "4",
        semester: "2",
        fileType: "PDF",
        tags: ["AG 451", "Agroforestry", "Social Forestry", "Climate Change", "Lecture Notes"],
        thumbnail: "",
        url: "",
        details: "Agrosilvicultural systems, tree-crop interactions, carbon sequestration, and sustainable land management.",
        author: "Dept. of Agroforestry",
        pages: "",
        size: "",
        session: "L4 S2"
      }
    ]
  }
};

export default agResourceData;
