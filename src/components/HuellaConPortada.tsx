"use client";

import React, { useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Label } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Plane, Car, Flame, Home, Map, ChevronRight, ChevronLeft, Download, MountainSnow, Droplets, Recycle, Trees, Bike, BadgeCheck, Zap, Truck } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ===== UTIL =====
const fmt = (n: number) => Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(n);

const PASOS = [
  { key: "id", label: "Identificación", icon: <Map className="w-4 h-4" /> },
  { key: "transporte", label: "Transporte", icon: <Car className="w-4 h-4" /> },
  { key: "alojamiento", label: "Alojamiento", icon: <Home className="w-4 h-4" /> },
  { key: "alimentacion", label: "Alimentación", icon: <Flame className="w-4 h-4" /> },
  { key: "actividades", label: "Actividades", icon: <MountainSnow className="w-4 h-4" /> },
  { key: "residuosagua", label: "Residuos y agua", icon: <Droplets className="w-4 h-4" /> },
  { key: "resultado", label: "Resultado", icon: <Leaf className="w-4 h-4" /> },
];

// Distancias ida (km) - ajusta a tu metodología
const CITY_PRESET_KM_ONEWAY: Record<string, number> = {
  "Chillán": 75, "Concepción": 220, "Santiago": 480,
  "Antofagasta": 0, "Valparaíso": 0, "Viña del Mar": 0,
  "La Serena": 0, "Temuco": 0, "Rancagua": 0,
  "Iquique": 0, "Puerto Montt": 0, "Otra": 0,
};
// Destinos disponibles en tu selector
const DESTINOS = [
  "Las Trancas",
  "Nevados de Chillán",
  "San Fabián",
  "Pinto",
  "Yungay",
  "El Carmen",
  "Pemuco",
  "Coihueco",
  "Laguna del Laja",
];

// Distancias de IDA (km) por combinación Origen → Destino principal
// Aproximadas. Ajusta a tu metodología/localidad cuando quieras.
const DIST_IDA_KM: Record<string, Record<string, number>> = {
  "Chillán": {
    "Las Trancas": 70,
    "Nevados de Chillán": 75,
    "San Fabián": 86,
    "Pinto": 38,
    "Yungay": 65,
    "El Carmen": 52,
    "Pemuco": 60,
    "Coihueco": 33,
    "Laguna del Laja": 140,
  },
  "Concepción": {
    "Las Trancas": 210,
    "Nevados de Chillán": 220,
    "San Fabián": 230,
    "Pinto": 165,
    "Yungay": 150,
    "El Carmen": 135,
    "Pemuco": 140,
    "Coihueco": 190,
    "Laguna del Laja": 190,
  },
  "Santiago": {
    "Las Trancas": 470,
    "Nevados de Chillán": 480,
    "San Fabián": 505,
    "Pinto": 445,
    "Yungay": 430,
    "El Carmen": 420,
    "Pemuco": 425,
    "Coihueco": 470,
    "Laguna del Laja": 520,
  },
  "Antofagasta": {
    "Las Trancas": 1640,
    "Nevados de Chillán": 1650,
    "San Fabián": 1670,
    "Pinto": 1630,
    "Yungay": 1620,
    "El Carmen": 1610,
    "Pemuco": 1620,
    "Coihueco": 1650,
    "Laguna del Laja": 1700,
  },
  "Valparaíso": {
    "Las Trancas": 520,
    "Nevados de Chillán": 530,
    "San Fabián": 555,
    "Pinto": 500,
    "Yungay": 485,
    "El Carmen": 475,
    "Pemuco": 480,
    "Coihueco": 525,
    "Laguna del Laja": 560,
  },
  "Viña del Mar": {
    "Las Trancas": 515,
    "Nevados de Chillán": 515,
    "San Fabián": 545,
    "Pinto": 495,
    "Yungay": 480,
    "El Carmen": 470,
    "Pemuco": 475,
    "Coihueco": 520,
    "Laguna del Laja": 555,
  },
  "La Serena": {
    "Las Trancas": 710,
    "Nevados de Chillán": 720,
    "San Fabián": 745,
    "Pinto": 690,
    "Yungay": 680,
    "El Carmen": 670,
    "Pemuco": 675,
    "Coihueco": 720,
    "Laguna del Laja": 760,
  },
  "Temuco": {
    "Las Trancas": 370,
    "Nevados de Chillán": 380,
    "San Fabián": 405,
    "Pinto": 350,
    "Yungay": 335,
    "El Carmen": 325,
    "Pemuco": 330,
    "Coihueco": 375,
    "Laguna del Laja": 260,
  },
  "Rancagua": {
    "Las Trancas": 420,
    "Nevados de Chillán": 430,
    "San Fabián": 455,
    "Pinto": 400,
    "Yungay": 390,
    "El Carmen": 380,
    "Pemuco": 385,
    "Coihueco": 430,
    "Laguna del Laja": 470,
  },
  "Iquique": {
    "Las Trancas": 1990,
    "Nevados de Chillán": 2000,
    "San Fabián": 2020,
    "Pinto": 1980,
    "Yungay": 1970,
    "El Carmen": 1960,
    "Pemuco": 1970,
    "Coihueco": 2000,
    "Laguna del Laja": 2050,
  },
  "Puerto Montt": {
    "Las Trancas": 630,
    "Nevados de Chillán": 640,
    "San Fabián": 665,
    "Pinto": 610,
    "Yungay": 600,
    "El Carmen": 590,
    "Pemuco": 595,
    "Coihueco": 640,
    "Laguna del Laja": 520,
  },
};


// Factores (ejemplos)
const F_TRANSP = { auto_gasolina:0.18, auto_diesel:0.20, auto_hibrido:0.11, kwh_100km:17, grid:0.35, bus:0.06, avion:0.15, van_local:0.10, moto_nieve_h:8.0, snowcat_h:4.0 };
const F_ALOJA = { hotel:9.0, hostal:6.0, cabana:5.5, camping:2.0, cal:{lena:3.0, gas:2.0, diesel:3.5, elec:1.5, ninguna:0.5} };
const F_ALIM = { locales:2.5, cadenas:3.2, auto:1.6, bonus_local:-0.6 };
const F_ACT = { ski:2.5, trekking:0.3, cabalgata:1.0, mtb:0.6, raquetas:0.4, canopy:0.8, moto:8.0, otro:0.8 };
const F_RES = { manejo:{sep:0.2, comunes:0.6, regreso:0.1, otro:0.5}, agua:{prom:0.5, bajo:0.2, alto:0.9} };

const ESTADO_INICIAL = {
  id: { origen:"Chillán", destino:"Nevados de Chillán", km_personalizado:0 },
  transporte: { medio:"Auto gasolina", pasajeros_auto:2, consumo_e_kwh_100:17, uso_local:[] as string[], km_local_total:20 },
  alojamiento: { tipo:"Cabaña", noches:2, calefaccion:"Leña", personas_total:2 },
  alimentacion: { donde:"Restaurantes locales", productos_locales:true, dias:2 },
  actividades: { seleccion:[] as string[], horas: {} as Record<string, number> },
  residuosagua: { manejo:"Separé y reciclé", agua:"Promedio (no sé)", dias:2 },
};

// Reusable card
function Card({children}:{children:React.ReactNode}){
  return <div className="shadow-lg rounded-2xl border border-slate-200">{children}</div>;
}
function CardHeader({title,icon,subtitle}:{title:string,icon:React.ReactNode,subtitle?:string}){
  return <div className="p-5 border-b">
    <div className="flex items-center gap-2 text-slate-800 text-lg font-semibold">
      <span className="inline-flex items-center justify-center p-2 rounded-xl bg-emerald-50 text-emerald-700">{icon}</span>
      <span>{title}</span>
    </div>
    {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
  </div>;
}
function CardContent({children}:{children:React.ReactNode}){
  return <div className="p-5 grid gap-4">{children}</div>
}

export default function HuellaConPortada(){
  const [start,setStart] = useState(false);
  return (
    <div className="relative min-h-screen text-white">
      <AnimatePresence initial={false} mode="wait">
        {!start ? (
          <motion.section
            key="cover"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative min-h-[100svh] flex items-center justify-center"
          >
            <img src="/laguna.jpeg" alt="Parque Nacional Laguna del Laja" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent" />
            <div className="relative z-10 text-center max-w-3xl px-6">
              <img src="/logo.png" alt="Logo" className="mx-auto mb-20 h-48 w-auto" />
              <motion.h1 initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="text-4xl sm:text-5xl md:text-6xl font-extrabold">
                Mide tu huella. <span className="text-emerald-300">Actúa</span>. Disfruta la ruta.
              </motion.h1>
              <p className="mt-5 text-lg text-white/90">Calcula tu huella de carbono para tu visita a la Reserva de Biósfera "Corredor Biológico Nevados de Chillán – Laguna del Laja"  y recibe acciones de compensación para compensar tu huella.</p>
              <motion.button onClick={()=>setStart(true)} whileTap={{ scale: 0.97 }} className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white/95 px-8 py-4 font-semibold text-gray-900 shadow-lg hover:bg-white">
                🚀 Comenzar ahora
              </motion.button>
            </div>
          </motion.section>
        ) : (
          <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Calculadora />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Calculadora(){
  const [paso,setPaso] = useState(0);
  const [st,setSt] = useState(ESTADO_INICIAL);
  // Banner por cada paso del formulario
  const bannerMap: Record<number, string> = {
    0: "/foto-identificacion.jpg",
    1: "/foto-transporte.png",
    2: "/foto-alojamiento.jpg",
    3: "/foto-alimentacion.jpg",
    4: "/foto-actividades.jpg",
    5: "/foto-residuos.jpg",
    6: "/foto-resultados.jpg",
  };
  const bannerSrc = bannerMap[paso] ?? "/laguna.jpeg";


  const set = (path:string, value:any) => {
    setSt(s => {
      const c:any = structuredClone(s);
      const keys = path.split(".");
      let cur:any = c;
      for (let i=0;i<keys.length-1;i++) cur = cur[keys[i]];
      cur[keys.at(-1)!] = value;
      return c;
    });
  };

  const progreso = Math.round(((paso+1)/PASOS.length)*100);

  const { desglose, totalKg, totalTons, topCat, baseKm } = useMemo(()=>{
    const baseKm = st.id.km_personalizado>0 ? st.id.km_personalizado : DIST_IDA_KM[st.id.origen]?.[st.id.destino]  ?? (CITY_PRESET_KM_ONEWAY[st.id.origen] ?? 0);
    const kmTotal = baseKm*2;

    let llegarKg = 0;
    switch(st.transporte.medio){
      case "Auto gasolina": llegarKg = (kmTotal*F_TRANSP.auto_gasolina)/Math.max(1, st.transporte.pasajeros_auto); break;
      case "Auto diésel": llegarKg = (kmTotal*F_TRANSP.auto_diesel)/Math.max(1, st.transporte.pasajeros_auto); break;
      case "Auto híbrido": llegarKg = (kmTotal*F_TRANSP.auto_hibrido)/Math.max(1, st.transporte.pasajeros_auto); break;
      case "Auto eléctrico": {
        const kwh = (kmTotal * st.transporte.consumo_e_kwh_100)/100;
        llegarKg = (kwh*F_TRANSP.grid)/Math.max(1, st.transporte.pasajeros_auto); break;
      }
      case "Bus interurbano": llegarKg = kmTotal*F_TRANSP.bus; break;
      case "Avión + transporte terrestre": {
        const km_avion = kmTotal*0.8, km_bus=kmTotal*0.2;
        llegarKg = km_avion*F_TRANSP.avion + km_bus*F_TRANSP.bus; break;
      }
      default: llegarKg = kmTotal*0.15;
    }

    let localKg = 0;
    const km_local = st.transporte.km_local_total;
    if (st.transporte.uso_local.includes("Traslado en van/bus")) localKg += km_local*F_TRANSP.van_local;
    if (st.transporte.uso_local.includes("Moto de nieve")) localKg += 2*F_TRANSP.moto_nieve_h;
    if (st.transporte.uso_local.includes("Snowcat/andarivel")) localKg += 2*F_TRANSP.snowcat_h;

    const noches = st.alojamiento.noches;
    const share = Math.max(1, st.alojamiento.personas_total);
    let alojBase = F_ALOJA.cabana;
    if (st.alojamiento.tipo==="Hotel") alojBase = F_ALOJA.hotel;
    if (st.alojamiento.tipo==="Hostal") alojBase = F_ALOJA.hostal;
    if (st.alojamiento.tipo==="Camping") alojBase = F_ALOJA.camping;

    let cal = F_ALOJA.cal.ninguna;
    if (st.alojamiento.calefaccion==="Leña") cal=F_ALOJA.cal.lena;
    if (st.alojamiento.calefaccion==="Gas") cal=F_ALOJA.cal.gas;
    if (st.alojamiento.calefaccion==="Diésel") cal=F_ALOJA.cal.diesel;
    if (st.alojamiento.calefaccion==="Electricidad") cal=F_ALOJA.cal.elec;
    const alojamientoKg = ((alojBase+cal)*noches)/share;

    const dias = st.alimentacion.dias;
    let alim = F_ALIM.locales;
    if (st.alimentacion.donde==="Cadenas externas") alim=F_ALIM.cadenas;
    if (st.alimentacion.donde==="Autoabastecido") alim=F_ALIM.auto;
    alim *= dias;
    if (st.alimentacion.productos_locales) alim += F_ALIM.bonus_local*dias;
    if (alim<0) alim=0;

    const H = st.actividades.horas as Record<string,number>;
    const act = (H["Ski/Snowboard"]||0)*F_ACT.ski + (H["Trekking"]||0)*F_ACT.trekking + (H["Cabalgata"]||0)*F_ACT.cabalgata + (H["MTB"]||0)*F_ACT.mtb + (H["Raquetas"]||0)*F_ACT.raquetas + (H["Canopy"]||0)*F_ACT.canopy + (H["Moto de nieve"]||0)*F_ACT.moto + (H["Otro"]||0)*F_ACT.otro;

    let res = F_RES.manejo.sep;
    if (st.residuosagua.manejo==="Basureros comunes") res=F_RES.manejo.comunes;
    if (st.residuosagua.manejo==="Me los llevé de regreso") res=F_RES.manejo.regreso;
    if (st.residuosagua.manejo==="Otro") res=F_RES.manejo.otro;

    let agua = F_RES.agua.prom;
    if (st.residuosagua.agua==="Bajo") agua = F_RES.agua.bajo;
    if (st.residuosagua.agua==="Alto") agua = F_RES.agua.alto;
    const resAgua = (res+agua)*st.residuosagua.dias;

    const desglose = [
      { name:"Transporte ida/regreso", kg:llegarKg },
      { name:"Transporte local", kg:localKg },
      { name:"Alojamiento", kg:alojamientoKg },
      { name:"Alimentación", kg:alim },
      { name:"Actividades", kg:act },
      { name:"Residuos/Agua", kg:resAgua },
    ];
    const totalKg = desglose.reduce((s,x)=>s+x.kg,0);
    const top = desglose.reduce((a,b)=>a.kg>b.kg?a:b, desglose[0]);
    return { desglose, totalKg, totalTons: totalKg/1000, topCat: top.name, baseKm };
  },[st]);

  const colores = ["#10b981","#0ea5e9","#f59e0b","#ef4444","#6366f1","#14b8a6"];

  const exportar = () => {
    const payload = { inputs: st, resultados: { desglose, totalKg, totalTons, topCat } };
    const blob = new Blob([JSON.stringify(payload,null,2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="resultado-huella-nevados.json"; a.click(); URL.revokeObjectURL(url);
  };

  const acciones: Record<string, Array<{icon: JSX.Element, titulo:string, texto:string}>> = {
    "Transporte ida/regreso": [
      { icon:<Car className="w-4 h-4"/>, titulo:"Comparte el auto", texto:"Llena los asientos: baja el CO₂e por persona."},
      { icon:<Plane className="w-4 h-4"/>, titulo:"Combina bus + avión", texto:"Reduce el tramo aéreo cuando sea posible."},
      { icon:<Bike className="w-4 h-4"/>, titulo:"Elige rutas cercanas", texto:"Prefiere destinos del corredor más próximos."},
    ],
    "Transporte local": [
      { icon:<Truck className="w-4 h-4"/>, titulo:"Van compartida", texto:"Evita múltiples autos dentro del valle."},
      { icon:<MountainSnow className="w-4 h-4"/>, titulo:"Limita moto de nieve", texto:"Solo si es necesario; prioriza andariveles."},
      { icon:<Bike className="w-4 h-4"/>, titulo:"Bici o a pie", texto:"Para trayectos cortos, sin motor."},
    ],
    "Alojamiento": [
      { icon:<Home className="w-4 h-4"/>, titulo:"Alojamiento eficiente", texto:"Prefiere cabañas/hostales con eficiencia energética."},
      { icon:<Zap className="w-4 h-4"/>, titulo:"Calefacción limpia", texto:"Leña seca certificada o electricidad eficiente."},
    ],
    "Alimentación": [
      { icon:<BadgeCheck className="w-4 h-4"/>, titulo:"Compra local", texto:"Más impacto en la comunidad, menos transporte."},
      { icon:<Recycle className="w-4 h-4"/>, titulo:"Menos envases", texto:"Usa contenedores reutilizables."},
    ],
    "Actividades": [
      { icon:<Trees className="w-4 h-4"/>, titulo:"Más trekking/MTB", texto:"Prioriza actividades de bajo impacto."},
      { icon:<MountainSnow className="w-4 h-4"/>, titulo:"Optimiza ski/snow", texto:"Concentra horas y evita traslados extra."},
    ],
    "Residuos/Agua": [
      { icon:<Recycle className="w-4 h-4"/>, titulo:"Basura cero", texto:"Separa y retorna residuos si no hay gestión."},
      { icon:<Droplets className="w-4 h-4"/>, titulo:"Ahorro de agua", texto:"Duchas cortas y uso racional."},
    ]
  };
 const renderLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, name } = props;
    const RAD = Math.PI / 180;
    const r = outerRadius + 18;
    const x = cx + r * Math.cos(-midAngle * RAD);
    const y = cy + r * Math.sin(-midAngle * RAD);

    if (percent < 0.03) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#334155"
        fontSize={12}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

      // Utilidad: convierte /public/archivo.png en dataURL para jsPDF
async function fileToDataURL(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const exportarPDF = async () => {
  // Colores (Tailwind-ish)
  const emerald = [16, 185, 129] as const;
  const slate   = [71, 85, 105] as const;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Header: banda de color
  doc.setFillColor(...emerald);
  doc.rect(0, 0, pageW, 80, "F");

  // Logo (opcional)
  const logo = await fileToDataURL("/logo.png"); // cambia si tu ruta es otra
  if (logo) {
    try {
      doc.addImage(logo, "PNG", 26, 16, 120, 48); // x,y,w,h
    } catch {
      // si falla, seguimos sin logo
    }
  }

  // Título
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Reporte de Huella de Carbono", logo ? 160 : 26, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Corredor Biológico Nevados de Chillán – Laguna del Laja", logo ? 160 : 26, 58);

  // Caja resumen total
  doc.setDrawColor(...emerald);
  doc.setLineWidth(1);
  doc.setTextColor(...slate);
  doc.roundedRect(26, 100, pageW - 52, 80, 10, 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Huella estimada de tu visita", 40, 125);

  // totalKg viene en kg (ya hiciste el cambio). Muestra grande:
  doc.setFontSize(28);
  doc.setTextColor(17, 94, 89); // un verde oscuro
  doc.text(`${(totalKg).toFixed(2)} kg CO₂e`, 40, 160);
  doc.setTextColor(...slate);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Equivalente a ${(totalKg).toFixed(1)} kg CO₂e`, 40, 178);

  // Breve contexto del viaje (si tienes baseKm/origen/destino)
  try {
    // Si en tu useMemo retornas baseKm, úsalo; si no, muestra km_personalizado:
    const baseKmMostrar =
      typeof baseKm !== "undefined"
        ? Math.round(baseKm)
        : (st?.id?.km_personalizado ? Math.round(st.id.km_personalizado) : 0);

    doc.setFontSize(10);
    doc.text(
      `Origen: ${st?.id?.origen ?? "-"}   ·   Destino: ${st?.id?.destino ?? "-"}   ·   Distancia ida: ${baseKmMostrar} km`,
      40,
      196
    );
  } catch {
    // sin bloqueo si no tienes baseKm
  }

  // Tabla de desglose
  const startY = 220;
  const rows = desglose.map((d: any) => {
    const pct = totalKg > 0 ? ((d.kg / totalKg) * 100).toFixed(1) + "%" : "0%";
    return [d.name, `${d.kg.toFixed(2)} kg`, pct];
  });

  autoTable(doc, {
    head: [["Categoría", "Emisiones", "Participación"]],
    body: rows,
    startY,
    styles: { font: "helvetica", fontSize: 10, textColor: slate as any },
    headStyles: { fillColor: emerald as any, textColor: [255, 255, 255] },
    bodyStyles: { fillColor: [248, 250, 252] }, // slate-50
    alternateRowStyles: { fillColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 220 },
      1: { halign: "right" },
      2: { halign: "right" },
    },
    margin: { left: 26, right: 26 },
  });

  // Acciones recomendadas (toma de accionesPorCategoria o acciones)
  const yAfter = (doc as any).lastAutoTable?.finalY
    ? (doc as any).lastAutoTable.finalY + 24
    : startY + 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...slate);
  doc.text(`Acciones recomendadas (mayor contribución: ${topCat})`, 26, yAfter);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const listaAcciones =
    (typeof acciones !== "undefined" && acciones?.[topCat]) ||
    (typeof acciones !== "undefined" && acciones?.[topCat]) ||
    [];

  let y = yAfter + 16;
  listaAcciones.forEach((a: any) => {
    // punto
    doc.setDrawColor(...emerald);
    doc.setFillColor(...emerald);
    doc.circle(30, y - 4, 2.5, "F");
    // título
    doc.setFont("helvetica", "bold");
    doc.text(a.titulo, 40, y);
    y += 14;
    // texto
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(a.texto, pageW - 80);
    doc.text(lines, 40, y);
    y += lines.length * 12 + 6;
  });

  // Footer
  const fecha = new Date().toLocaleString();
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generado el ${fecha} · huellarutas.cl`, 26, 820);

  doc.save("reporte-huella.pdf");
};

// Colores fijos por categoría (elige los que prefieras)
const COLOR_BY_CAT: Record<string, string> = {
  "Transporte ida/regreso": "#10b981",   // verde
  "Transporte local": "#0ea5e9", // celeste
  "Alojamiento": "#f59e0b",     // amarillo/naranja
  "Alimentación": "#ef4444",    // rojo
  "Actividades": "#6366f1",     // violeta
  "Residuos/Agua": "#14b8a6",   // teal
};

// Reconstruye la data del donut con el color correcto por nombre
const donutData = React.useMemo(
  () =>
    (desglose ?? []).map((d) => ({
      ...d,
      color: COLOR_BY_CAT[d.name] ?? "#94a3b8", // gris si no está mapeado
    })),
  [desglose]
);

// Etiqueta externa: muestra "Nombre XX%" fuera de cada porción (oculta < 2%)
function OutsideLabel(props: any) {
  const { cx, cy, midAngle, outerRadius, percent, name } = props;
  if (!percent || percent * 100 < 2) return null; // oculta porciones muy pequeñas
  const RAD = Math.PI / 180;
  const r = outerRadius + 14;
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);

  return (
    <text
      x={x}
      y={y}
      fill="#0f172a"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontFamily="Inter, ui-sans-serif, system-ui"
      fontSize={20}
    >
      {name} {(percent * 100).toFixed(0)}%
    </text>
  );
}

// Texto centrado dentro del donut (usa Label content de Recharts)
function CenterLabel({ viewBox }: any) {
  const { cx, cy } = viewBox || { cx: 0, cy: 0 };
  return (
    <g>
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="28"
        fontFamily="Inter, ui-sans-serif, system-ui"
        fontWeight={700}
        fill="#0f172a"
      >
        {Number(totalKg || 0).toFixed(2)} kg
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="14"
        fontFamily="Inter, ui-sans-serif, system-ui"
        fontWeight={500}
        fill="#64748b"
      >
        CO₂e
      </text>
    </g>
  );
}

// Tooltip: muestra "x.xx kg (yy%)"
const tooltipFormatter = (value: number, _name: string, params: any) => {
  const v = Number(value || 0);
  const pct = totalKg ? (v / totalKg) * 100 : 0;
  return [`${v.toFixed(2)} kg (${pct.toFixed(0)}%)`, ""]; // [valor, etiqueta]
};

// ---- Etiqueta exterior más pegada al donut
const outerLabel = (props: any) => {
  const RAD = Math.PI / 180;
  const {
    cx, cy, midAngle, outerRadius, percent, name,
  } = props;
if (!percent || percent * 100 < 2) return null; // oculta <2%

  // Distancia desde el borde del donut a la etiqueta
  // (baja este número para pegarla más)
  const GAP = 25;                         // antes 12–14

  const r = outerRadius + GAP;
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);
  const anchor = x >= cx ? 'start' : 'end';

  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="middle"
      className="fill-slate-700"
      style={{ fontSize: 13 }}
    >
      {name} {Math.round((percent ?? 0) * 100)}%
    </text>
  );
};

// Texto central del donut
function CenterText({ viewBox, totalKg }: any) {
  if (!viewBox || !viewBox.cx || !viewBox.cy) return null;

  const { cx, cy } = viewBox;

  return (
    <g>
      <text
        x={cx}
        y={cy - 5}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={28}
        fontWeight="bold"
        fill="#0f172a"
      >
        {totalKg.toFixed(2)} kg
      </text>
      <text
        x={cx}
        y={cy + 20}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        fill="#475569"
      >
        CO₂e
      </text>
    </g>
  );
}

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-slate-800">
      <header className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <img src="/logo.png" alt="Logo" className="h-20 w-auto" />
          <div>
            <h1 className="text-2xl font-semibold">Huella de tu visita – Nevados de Chillán & Laguna del Laja</h1>
            <p className="text-sm text-slate-500">Calcula tu impacto y recibe acciones locales para reducir y compensar.</p>
          </div>
        </div>
        <div className="hidden md:flex gap-2 text-sm">
          {PASOS.map((s,i)=>(
            <div key={s.key} className={`px-3 py-1 rounded-full border ${i===paso?"bg-emerald-600 text-white border-emerald-600":"bg-white text-slate-600 border-slate-200"}`}>
              <span className="inline-flex items-center gap-1">{s.icon}{s.label}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4">
        <div className="rounded-2xl overflow-hidden mb-6">
          <img src={bannerSrc} alt="Imagen de la sección" className="w-full h-52 object-cover" />
        </div>

        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-emerald-600" style={{width:`${Math.max(5, progreso)}%`}} />
        </div>

        {paso===0 && (
        
          <Card>
            <CardHeader title="Identificación" icon={<Map/>} subtitle="Origen, destino y distancia (ida; calculamos ida y vuelta)." />
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Ciudad/punto de origen</label>
                  <select className="mt-1 w-full border rounded-md px-3 py-2" value={st.id.origen} onChange={e=>set("id.origen", e.target.value)}>
                    {Object.keys(CITY_PRESET_KM_ONEWAY).map(c=>(<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-sm">Destino principal</label>
                  <select className="mt-1 w-full border rounded-md px-3 py-2" value={st.id.destino} onChange={e=>set("id.destino", e.target.value)}>
                    {["Las Trancas","Nevados de Chillán","San Fabián","Pinto","Yungay","El Carmen","Pemuco","Coihueco","Laguna del Laja","Otro"].map(x=>(<option key={x} value={x}>{x}</option>))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm">Distancia estimada ida (km) — personaliza si tu ciudad es lejana</label>
                  <input type="number" min={0} className="mt-1 w-full border rounded-md px-3 py-2" value={st.id.km_personalizado} onChange={e=>set("id.km_personalizado", Number(e.target.value||0))} />
                  <p className="text-xs text-slate-500 mt-1">Si dejas en cero, usamos el valor referencial según tu ciudad. El cálculo considera ida + vuelta.</p>
                  <p className="text-xs text-slate-500 mt-1"> Usando {Math.round(baseKm)} km de ida según la combinación {st.id.origen} → {st.id.destino}.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {paso===1 && (
          <Card>
            <CardHeader title="Transporte" icon={<Car/>} subtitle="Modo para llegar y movilidad local." />
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Medio utilizado para llegar</label>
                  <select className="mt-1 w-full border rounded-md px-3 py-2" value={st.transporte.medio} onChange={e=>set("transporte.medio", e.target.value)}>
                    {["Auto gasolina","Auto diésel","Auto híbrido","Auto eléctrico","Bus interurbano","Avión + transporte terrestre","Otro"].map(x=>(<option key={x} value={x}>{x}</option>))}
                  </select>
                </div>
                {st.transporte.medio.startsWith("Auto") && (
                  <div>
                    <label className="text-sm">Pasajeros (incluyéndote)</label>
                    <input type="number" min={1} className="mt-1 w-full border rounded-md px-3 py-2" value={st.transporte.pasajeros_auto} onChange={e=>set("transporte.pasajeros_auto", Number(e.target.value||1))} />
                  </div>
                )}
                {st.transporte.medio==="Auto eléctrico" && (
                  <div className="sm:col-span-2">
                    <label className="text-sm">Consumo p/auto eléctrico (kWh/100 km)</label>
                    <input type="number" min={8} className="mt-1 w-full border rounded-md px-3 py-2" value={st.transporte.consumo_e_kwh_100} onChange={e=>set("transporte.consumo_e_kwh_100", Number(e.target.value||15))} />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="text-sm">Transporte local utilizado</label>
                  <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                    {["Traslado en van/bus","Moto de nieve","Snowcat/andarivel","Bicicleta","A pie","Otro"].map(opt=>(
                      <label key={opt} className="flex items-center gap-2">
                        <input type="checkbox" checked={st.transporte.uso_local.includes(opt)} onChange={e=>{
                          const setSel = new Set(st.transporte.uso_local);
                          e.target.checked ? setSel.add(opt) : setSel.delete(opt);
                          set("transporte.uso_local", Array.from(setSel));
                        }} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm">Km locales (ida + vuelta)</label>
                  <input type="number" min={0} className="mt-1 w-full border rounded-md px-3 py-2" value={st.transporte.km_local_total} onChange={e=>set("transporte.km_local_total", Number(e.target.value||0))} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {paso===2 && (
          <Card>
            <CardHeader title="Alojamiento" icon={<Home/>} subtitle="Tipo, noches, calefacción y si compartes." />
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Tipo de alojamiento</label>
                  <select className="mt-1 w-full border rounded-md px-3 py-2" value={st.alojamiento.tipo} onChange={e=>set("alojamiento.tipo", e.target.value)}>
                    {["Hotel","Hostal","Cabaña","Camping"].map(x=>(<option key={x} value={x}>{x}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-sm">Noches</label>
                  <input type="number" min={0} className="mt-1 w-full border rounded-md px-3 py-2" value={st.alojamiento.noches} onChange={e=>set("alojamiento.noches", Number(e.target.value||0))} />
                </div>
                <div>
                  <label className="text-sm">Calefacción</label>
                  <select className="mt-1 w-full border rounded-md px-3 py-2" value={st.alojamiento.calefaccion} onChange={e=>set("alojamiento.calefaccion", e.target.value)}>
                    {["Leña","Gas","Diésel","Electricidad","Ninguna"].map(x=>(<option key={x} value={x}>{x}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-sm">Compartido (personas totales)</label>
                  <input type="number" min={1} className="mt-1 w-full border rounded-md px-3 py-2" value={st.alojamiento.personas_total} onChange={e=>set("alojamiento.personas_total", Number(e.target.value||1))} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {paso===3 && (
          <Card>
            <CardHeader title="Alimentación" icon={<Flame/>} subtitle="Dónde consumiste y si eliges productos locales." />
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">¿Dónde consumiste la mayoría?</label>
                  <select className="mt-1 w-full border rounded-md px-3 py-2" value={st.alimentacion.donde} onChange={e=>set("alimentacion.donde", e.target.value)}>
                    {["Restaurantes locales","Cadenas externas","Autoabastecido"].map(x=>(<option key={x} value={x}>{x}</option>))}
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-7">
                  <input type="checkbox" checked={st.alimentacion.productos_locales} onChange={e=>set("alimentacion.productos_locales", e.target.checked)} />
                  <span className="text-sm">¿Principalmente productos locales?</span>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm">Días de estadía</label>
                  <input type="number" min={0} className="mt-1 w-full border rounded-md px-3 py-2" value={st.alimentacion.dias} onChange={e=>set("alimentacion.dias", Number(e.target.value||0))} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {paso===4 && (
          <Card>
            <CardHeader title="Actividades" icon={<MountainSnow/>} subtitle="Selecciona actividades y horas por actividad." />
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 grid grid-cols-2 gap-3 text-sm">
                  {["Ski/Snowboard","Trekking","Cabalgata","MTB","Raquetas","Canopy","Moto de nieve","Otro"].map(act=>(
                    <label key={act} className="flex items-center gap-2">
                      <input type="checkbox" checked={st.actividades.seleccion.includes(act)} onChange={e=>{
                        const setSel = new Set(st.actividades.seleccion);
                        e.target.checked ? setSel.add(act) : setSel.delete(act);
                        set("actividades.seleccion", Array.from(setSel));
                      }} />
                      {act}
                    </label>
                  ))}
                </div>
                {st.actividades.seleccion.map(act=>(
                  <div key={act}>
                    <label className="text-sm">Horas en {act}</label>
                    <input type="number" min={0} className="mt-1 w-full border rounded-md px-3 py-2" value={st.actividades.horas[act]||0} onChange={e=>set(`actividades.horas.${act}`, Number(e.target.value||0))} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {paso===5 && (
          <Card>
            <CardHeader title="Residuos y agua" icon={<Droplets/>} subtitle="Manejo de residuos, consumo de agua y días de visita." />
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Manejo de residuos</label>
                  <select className="mt-1 w-full border rounded-md px-3 py-2" value={st.residuosagua.manejo} onChange={e=>set("residuosagua.manejo", e.target.value)}>
                    {["Separé y reciclé","Basureros comunes","Me los llevé de regreso","Otro"].map(x=>(<option key={x} value={x}>{x}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-sm">Consumo de agua por día</label>
                  <select className="mt-1 w-full border rounded-md px-3 py-2" value={st.residuosagua.agua} onChange={e=>set("residuosagua.agua", e.target.value)}>
                    {["Promedio (no sé)","Bajo","Alto"].map(x=>(<option key={x} value={x}>{x}</option>))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm">Días de visita</label>
                  <input type="number" min={0} className="mt-1 w-full border rounded-md px-3 py-2" value={st.residuosagua.dias} onChange={e=>set("residuosagua.dias", Number(e.target.value||0))} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {paso===6 && (
          <Card>
            <CardHeader title="Resultado y acciones" icon={<Leaf/>} subtitle="Desglose por categoría, total y recomendaciones dinámicas." />
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="order-2 md:order-1">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <div className="text-sm text-emerald-700">Huella estimada de tu visita</div>
                    <div className="text-4xl font-bold text-emerald-800">{totalKg.toFixed(2)} kg CO₂e</div>
                    <div className="text-xs text-slate-500 mt-1">Equivalente a {fmt(totalKg)} kg CO₂e</div>
                  </div>
                  <div className="mt-4">
                    <div className="flex gap-2 text-sm mb-2">
                      <span className="px-3 py-1 rounded-full bg-slate-100">Desglose</span>
                      <span className="px-3 py-1 rounded-full bg-slate-100">Acciones</span>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm">
                      {desglose.map((b,i)=>(
                        <li key={b.name} className="flex justify-between py-1 border-b border-slate-100">
                          <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{background:colores[i%colores.length]}} />{b.name}</span>
                           <span>{b.kg.toFixed(2)} kg</span>
                        </li>
                      ))}
                    </ul>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 mt-4">
                      <p className="font-medium">Acciones principales según mayor contribución: <span className="capitalize">{topCat}</span></p>
                      <ul className="mt-2 space-y-2">
                        {(acciones[topCat]||[]).map((a,idx)=>(
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-0.5">{a.icon}</span>
                            <div><p className="font-medium">{a.titulo}</p><p className="text-slate-600 text-xs">{a.texto}</p></div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={exportar} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-white hover:bg-slate-50">
                      <Download className="w-4 h-4" /> Exportar JSON
                    </button>
                    <button type="button" onClick={exportarPDF} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border">📄 Exportar PDF
                    </button>
                  </div>
                </div>
                <div style={{ transform: 'scale(0.92)', transformOrigin: 'center' }}>
             <ResponsiveContainer width="100%" height={300}>
  <PieChart margin={{ top: 10, right: 136, bottom: 10, left: 20 }}>
    <defs>
      <filter id="softShadow2" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.12" />
      </filter>
    </defs>

    <Pie
      data={donutData}
      dataKey="kg"
      nameKey="name"
      cx="67%"
      cy="46%"
      innerRadius={72}
      outerRadius={104}
      paddingAngle={2}
      cornerRadius={10}
      labelLine={true} 
      label={outerLabel}
      stroke="#ffffff"
      strokeWidth={2}
      isAnimationActive
      animationDuration={600}
      filter="url(#softShadow2)"
    >
      {donutData.map((entry, i) => (
        <Cell key={`cell-${i}`} fill={entry.color} />
      ))}

      <Label
        content={(props) => <CenterText {...props} totalKg={totalKg} />}
        position="center"
      />
    </Pie>

    <Tooltip
      formatter={(v: number, n: string) => {
        const pct = totalKg > 0 ? ((v / totalKg) * 100).toFixed(1) : "0.0";
        return [`${v.toFixed(2)} kg (${pct}%)`, n];
      }}
    />
  </PieChart>
</ResponsiveContainer>
</div>

              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between my-6">
          <button onClick={()=>setPaso(p=>Math.max(0,p-1))} disabled={paso===0} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-white hover:bg-slate-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /> Atrás</button>
          <div className="text-sm text-slate-500">Paso {paso+1} de {PASOS.length}</div>
          <button onClick={()=>setPaso(p=>Math.min(PASOS.length-1,p+1))} disabled={paso===PASOS.length-1} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-white hover:bg-slate-50 disabled:opacity-50">Siguiente <ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <footer className="mt-12 border-t">
        <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-slate-400">Corredor Biológico Nevados de Chillán – Laguna del Laja</p>
            <p className="text-slate-400">(Ñuble/Biobío).</p>
          </div>
          <div>
            <p className="font-medium text-slate-600">Universidad de Concepción</p>
            <p className="text-slate-500 mt-1">Departamento de Ingeniería Industrial</p>
          </div>
          <div>
            <p className="font-medium text-slate-600">Calculadora de huella de carbono</p>
            <p className="text-slate-500 mt-1">Mide y contribuye con tu visita</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
