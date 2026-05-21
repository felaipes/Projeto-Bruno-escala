import { prisma } from "@/lib/db";
import { CalendarView } from "@/components/CalendarView";
import { AlertCircle } from "lucide-react";

const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

export default async function ProfissionalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let schedule: {
    id: string;
    month: number;
    year: number;
    assignments: { id: string; shift_id: string; shift_name: string; collaborator_id: string; collaborator_name: string; date: string; start_time: string; end_time: string }[];
  } | null = null;
  let error: string | null = null;

  try {
    const found = await prisma.schedule.findUnique({
      where: { access_token: token },
      include: { assignments: true },
    });
    if (!found) throw new Error("Escala não encontrada");
    schedule = {
      id: found.id,
      month: found.month,
      year: found.year,
      assignments: found.assignments.map((a) => ({
        id: a.id,
        shift_id: a.shift_id,
        shift_name: a.shift_name,
        collaborator_id: a.collaborator_id,
        collaborator_name: a.collaborator_name,
        date: a.date,
        start_time: a.start_time,
        end_time: a.end_time,
      })),
    };
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : "Erro desconhecido";
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-6">
      <div className="bg-[#141414] border border-[#232323] rounded-2xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-2xl font-extrabold text-center mb-2 tracking-tight">
          Escala Certa<span className="text-[#FF4D1C]">.net</span>
        </h1>

        {error ? (
          <div className="mt-8 flex flex-col items-center gap-3 text-red-400">
            <AlertCircle size={40} />
            <p className="font-semibold">Escala não encontrada ou link expirado.</p>
            <p className="text-sm text-[#A1A1A1]">{error}</p>
          </div>
        ) : schedule ? (
          <>
            <p className="text-center text-[#A1A1A1] mb-8">
              {MONTH_NAMES[schedule.month - 1]} {schedule.year}
            </p>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#1E1E1E] text-center">
                <p className="text-xs text-[#A1A1A1] uppercase tracking-wider font-semibold mb-1">Total de plantões</p>
                <p className="text-3xl font-extrabold text-[#FF4D1C]">{schedule.assignments.length}</p>
              </div>
              <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#1E1E1E] text-center">
                <p className="text-xs text-[#A1A1A1] uppercase tracking-wider font-semibold mb-1">Colaboradores escalados</p>
                <p className="text-3xl font-extrabold text-white">
                  {new Set(schedule.assignments.map((a) => a.collaborator_id)).size}
                </p>
              </div>
            </div>

            <CalendarView month={schedule.month} year={schedule.year} assignments={schedule.assignments} />

            {/* Full list */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-[#232323]">
              <table className="w-full">
                <thead className="bg-[#0A0A0A] border-b border-[#232323]">
                  <tr>
                    {["Data", "Colaborador", "Turno", "Entrada", "Saída"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-[#A1A1A1] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-[#141414] divide-y divide-[#1E1E1E]">
                  {schedule.assignments.map((a, i) => (
                    <tr key={i} className="hover:bg-[#1A1A1A] transition-colors">
                      <td className="px-4 py-3 text-sm text-[#A1A1A1]">{a.date}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-white">{a.collaborator_name}</td>
                      <td className="px-4 py-3 text-sm text-[#A1A1A1]">{a.shift_name}</td>
                      <td className="px-4 py-3 text-sm text-white">{a.start_time}</td>
                      <td className="px-4 py-3 text-sm text-white">{a.end_time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
