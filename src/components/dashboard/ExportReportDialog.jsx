import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, Loader2 } from "lucide-react";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";

export default function ExportReportDialog({
  open,
  onOpenChange,
  contacts,
  users,
  templates,
}) {
  const [format, setFormat] = useState("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [includeContacts, setIncludeContacts] = useState(true);
  const [includeTeam, setIncludeTeam] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);

  const calculateMetrics = () => {
    const today = new Date();
    const thisMonth = contacts.filter((c) => {
      if (!c.created_date) return false;
      const date = new Date(c.created_date);
      return (
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    });

    const resolved = contacts.filter((c) => c.status === "resolvido");
    const conversionRate =
      contacts.length > 0
        ? ((resolved.length / contacts.length) * 100).toFixed(1)
        : 0;

    return {
      totalContacts: contacts.length,
      newThisMonth: thisMonth.length,
      resolved: resolved.length,
      conversionRate,
      activeUsers: users.filter((u) => u.status === "online").length,
      totalUsers: users.length,
    };
  };

  const exportToCSV = () => {
    let csvContent = "";

    if (includeMetrics) {
      const metrics = calculateMetrics();
      csvContent += "MÉTRICAS GERAIS\n";
      csvContent += `Data do Relatório,${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}\n`;
      csvContent += `Total de Contatos,${metrics.totalContacts}\n`;
      csvContent += `Novos este Mês,${metrics.newThisMonth}\n`;
      csvContent += `Resolvidos,${metrics.resolved}\n`;
      csvContent += `Taxa de Conversão,${metrics.conversionRate}%\n`;
      csvContent += `Usuários Ativos,${metrics.activeUsers}/${metrics.totalUsers}\n\n`;
    }

    if (includeContacts && contacts.length > 0) {
      csvContent += "CONTATOS\n";
      csvContent += "Nome,Telefone,Email,Empresa,Status,Tags,Data de Criação\n";
      contacts.forEach((c) => {
        csvContent += `"${c.name || ""}","${c.phone || ""}","${c.email || ""}","${c.company || ""}","${c.status || ""}","${c.tags?.join("; ") || ""}","${c.created_date ? format(new Date(c.created_date), "dd/MM/yyyy", { locale: ptBR }) : ""}"\n`;
      });
      csvContent += "\n";
    }

    if (includeTeam && users.length > 0) {
      csvContent += "EQUIPE\n";
      csvContent += "Nome,Email,Cargo,Status,Atendimentos Simultâneos\n";
      users.forEach((u) => {
        const roleLabels = {
          admin: "Administrador",
          supervisor: "Supervisor",
          user: "Atendente",
        };
        const statusLabels = {
          online: "Online",
          away: "Ausente",
          offline: "Offline",
        };
        csvContent += `"${u.full_name || ""}","${u.email || ""}","${roleLabels[u.role] || u.role}","${statusLabels[u.status] || "Offline"}","${u.max_simultaneous || 5}"\n`;
      });
    }

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `relatorio_crm_${format(new Date(), "dd-MM-yyyy_HH-mm")}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const metrics = calculateMetrics();
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(99, 102, 241); // Primary color
    doc.text("Relatório CRM Smart", 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      20,
      yPos,
    );
    yPos += 15;

    if (includeMetrics) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Métricas Gerais", 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Total de Contatos: ${metrics.totalContacts}`, 25, yPos);
      yPos += 6;
      doc.text(`Novos este Mês: ${metrics.newThisMonth}`, 25, yPos);
      yPos += 6;
      doc.text(`Resolvidos: ${metrics.resolved}`, 25, yPos);
      yPos += 6;
      doc.text(`Taxa de Conversão: ${metrics.conversionRate}%`, 25, yPos);
      yPos += 6;
      doc.text(
        `Usuários Ativos: ${metrics.activeUsers}/${metrics.totalUsers}`,
        25,
        yPos,
      );
      yPos += 12;
    }

    if (includeContacts && contacts.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Resumo de Contatos", 20, yPos);
      yPos += 8;

      const statusCount = {
        novo: contacts.filter((c) => c.status === "novo").length,
        em_atendimento: contacts.filter((c) => c.status === "em_atendimento")
          .length,
        aguardando: contacts.filter((c) => c.status === "aguardando").length,
        resolvido: contacts.filter((c) => c.status === "resolvido").length,
        escalado: contacts.filter((c) => c.status === "escalado").length,
      };

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`• Novo: ${statusCount.novo}`, 25, yPos);
      yPos += 6;
      doc.text(`• Em Atendimento: ${statusCount.em_atendimento}`, 25, yPos);
      yPos += 6;
      doc.text(`• Aguardando: ${statusCount.aguardando}`, 25, yPos);
      yPos += 6;
      doc.text(`• Resolvido: ${statusCount.resolvido}`, 25, yPos);
      yPos += 6;
      doc.text(`• Escalado: ${statusCount.escalado}`, 25, yPos);
      yPos += 12;
    }

    if (includeTeam && users.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Equipe", 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Total de Membros: ${users.length}`, 25, yPos);
      yPos += 6;
      doc.text(
        `Administradores: ${users.filter((u) => u.role === "admin").length}`,
        25,
        yPos,
      );
      yPos += 6;
      doc.text(
        `Supervisores: ${users.filter((u) => u.role === "supervisor").length}`,
        25,
        yPos,
      );
      yPos += 6;
      doc.text(
        `Atendentes: ${users.filter((u) => u.role === "user").length}`,
        25,
        yPos,
      );
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: "center" });
      doc.text("CRM Smart - Sistema de Gestão de Relacionamento", 105, 285, {
        align: "center",
      });
    }

    doc.save(`relatorio_crm_${format(new Date(), "dd-MM-yyyy_HH-mm")}.pdf`);
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate processing

      if (format === "csv") {
        exportToCSV();
      } else {
        exportToPDF();
      }

      onOpenChange(false);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Exportar Relatório
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Formato do Arquivo</Label>
            <RadioGroup value={format} onValueChange={setFormat}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="font-normal cursor-pointer">
                  CSV (Excel, Google Sheets)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="font-normal cursor-pointer">
                  PDF (Relatório formatado)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Incluir no Relatório</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="metrics"
                  checked={includeMetrics}
                  onCheckedChange={setIncludeMetrics}
                />
                <Label htmlFor="metrics" className="font-normal cursor-pointer">
                  Métricas e estatísticas
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contacts"
                  checked={includeContacts}
                  onCheckedChange={setIncludeContacts}
                />
                <Label
                  htmlFor="contacts"
                  className="font-normal cursor-pointer"
                >
                  Lista de contatos ({contacts.length})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="team"
                  checked={includeTeam}
                  onCheckedChange={setIncludeTeam}
                />
                <Label htmlFor="team" className="font-normal cursor-pointer">
                  Dados da equipe ({users.length})
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={
              isExporting ||
              (!includeMetrics && !includeContacts && !includeTeam)
            }
            className="bg-primary hover:bg-primary/90 gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Exportar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
