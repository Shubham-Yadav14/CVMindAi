import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import connectDB from "@/app/lib/mongodb";
import Template from "@/app/models/Template";

const starterTemplates = [
  {
    name: "Classic",
    description: "A clean, traditional resume for every industry.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='720' height='920' viewBox='0 0 720 920'%3E%3Crect width='720' height='920' fill='%23f8fafc'/%3E%3Crect x='54' y='58' width='300' height='30' rx='4' fill='%231e293b'/%3E%3Crect x='54' y='112' width='210' height='12' fill='%2394a3b8'/%3E%3Crect x='54' y='190' width='612' height='3' fill='%23cbd5e1'/%3E%3Cg fill='%23475569'%3E%3Crect x='54' y='230' width='190' height='15'/%3E%3Crect x='54' y='270' width='560' height='10'/%3E%3Crect x='54' y='300' width='500' height='10'/%3E%3Crect x='54' y='350' width='220' height='15'/%3E%3Crect x='54' y='390' width='570' height='10'/%3E%3Crect x='54' y='420' width='480' height='10'/%3E%3C/g%3E%3C/svg%3E",
    latexCode: "\\documentclass[11pt]{article}\n\\usepackage[margin=0.7in]{geometry}\n\\begin{document}\n\\begin{center}\n{\\LARGE \\textbf{Your Name}}\\\\\nemail@example.com | +1 555 000 0000 | linkedin.com/in/yourname\n\\end{center}\n\\section*{Professional Summary}\nWrite a concise summary of your experience and goals.\n\\section*{Experience}\n\\textbf{Job Title} \\hfill Company Name\\\\\nDescribe your impact, responsibilities, and measurable results.\n\\section*{Education}\n\\textbf{Degree} \\hfill University Name\n\\end{document}",
  },
  {
    name: "Modern",
    description: "A confident layout with strong visual hierarchy.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='720' height='920' viewBox='0 0 720 920'%3E%3Crect width='720' height='920' fill='white'/%3E%3Crect width='230' height='920' fill='%230f766e'/%3E%3Crect x='42' y='70' width='145' height='145' rx='72' fill='%23ccfbf1'/%3E%3Crect x='278' y='72' width='360' height='32' rx='4' fill='%230f172a'/%3E%3Crect x='278' y='125' width='270' height='12' fill='%2394a3b8'/%3E%3Cg fill='%230f766e'%3E%3Crect x='278' y='220' width='180' height='15'/%3E%3Crect x='278' y='260' width='350' height='10'/%3E%3Crect x='278' y='290' width='300' height='10/%3E%3Crect x='278' y='365' width='190' height='15/%3E%3Crect x='278' y='405' width='340' height='10/%3E%3C/g%3E%3C/svg%3E",
    latexCode: "\\documentclass[11pt]{article}\n\\usepackage[margin=0.7in]{geometry}\n\\usepackage{xcolor}\n\\definecolor{accent}{HTML}{0F766E}\n\\begin{document}\n{\\Huge \\textcolor{accent}{\\textbf{Your Name}}}\\\\\n\\textit{Product Designer | email@example.com | +1 555 000 0000}\n\\section*{Profile}\nA focused introduction that tells your professional story.\n\\section*{Selected Experience}\n\\textbf{Role, Company} \\hfill 2022--Present\\\\\nDelivered meaningful outcomes for customers through thoughtful, measurable work.\n\\section*{Skills}\nProduct strategy, research, prototyping, communication\n\\end{document}",
  },
  {
    name: "Minimal",
    description: "Plenty of whitespace for a focused, readable resume.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='720' height='920' viewBox='0 0 720 920'%3E%3Crect width='720' height='920' fill='%23fffdf7'/%3E%3Crect x='70' y='80' width='250' height='26' fill='%239c2c20'/%3E%3Crect x='70' y='125' width='170' height='10' fill='%23a8a29e'/%3E%3Cg fill='%23787171'%3E%3Crect x='70' y='230' width='120' height='13'/%3E%3Crect x='70' y='270' width='530' height='9/%3E%3Crect x='70' y='300' width='450' height='9/%3E%3Crect x='70' y='370' width='130' height='13/%3E%3Crect x='70' y='410' width='510' height='9/%3E%3C/g%3E%3C/svg%3E",
    latexCode: "\\documentclass[11pt]{article}\n\\usepackage[margin=1in]{geometry}\n\\begin{document}\n\\begin{flushleft}\n{\\Huge \\textbf{Your Name}}\\\\\nemail@example.com \\textbullet{} City, Country\n\\end{flushleft}\n\\section*{About}\nA short, precise statement about your professional focus.\n\\section*{Work Experience}\n\\textbf{Position} -- Company\\hfill 2020--Present\\\\\nUse short bullet points to describe your strongest contributions.\n\\section*{Education}\n\\textbf{Bachelor of Science} -- University\n\\end{document}",
  },
];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    if (await Template.countDocuments() === 0) await Template.insertMany(starterTemplates);
    const templates = await Template.find().select("name description image").sort({ createdAt: 1 }).lean();
    return NextResponse.json({ templates: templates.map((template) => ({ id: template._id.toString(), ...template })) });
  } catch (error) {
    console.error("Get templates error:", error);
    return NextResponse.json({ error: "Unable to load templates" }, { status: 500 });
  }
}