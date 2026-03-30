import React, { useState } from "react";
import { FileUpload } from "./components/FileUpload";
import { ColorInput } from "./components/ColorInput";
import { Section } from "./components/Section";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import { motion } from "motion/react";

type PlaceholderSection = Record<string, string>;

const SECTION_DEFINITIONS = [
  { id: "brand", title: "Brand Information" },
  { id: "about", title: "About Section" },
  { id: "logo", title: "Logo Design" },
  { id: "colors", title: "Color Palette" },
  { id: "typography", title: "Typography" },
  { id: "illustrations", title: "Illustrations" },
  { id: "images", title: "Images" },
  { id: "patterns", title: "Patterns" },
  { id: "collaterals", title: "Collaterals" },
  { id: "guidelines", title: "Brand Guidelines" },
];

const DEFAULT_SECTION_LABELS: Record<string, string> = {
  brand: "(01) Brand Information",
  about: "(02) About The Brand",
  logo: "(03) Logo Design",
  colors: "(04) Color Palette",
  typography: "(05) Typography",
  illustrations: "(06) Illustrations",
  images: "(07) Images",
  patterns: "(08) Patterns",
  collaterals: "(09) Collaterals",
  guidelines: "(10) Brand Guidelines",
};

const DEFAULT_SECTION_ORDER = SECTION_DEFINITIONS.map((section) => section.id);

const DEFAULT_SECTION_VISIBILITY = SECTION_DEFINITIONS.reduce<
  Record<string, boolean>
>((acc, section) => {
  acc[section.id] = true;
  return acc;
}, {});

const PLACEHOLDER_GRID_IMAGE_KEYS = Array.from(
  { length: 6 },
  (_, index) => `placeholder_grid_image_${index + 1}`,
);
const PLACEHOLDER_PDF_GROUPS = [
  {
    title: "placeholder_pdf_title_1",
    description: "placeholder_pdf_description_1",
    link: "placeholder_pdf_link_1",
  },
  {
    title: "placeholder_pdf_title_2",
    description: "placeholder_pdf_description_2",
    link: "placeholder_pdf_link_2",
  },
  {
    title: "placeholder_pdf_title_3",
    description: "placeholder_pdf_description_3",
    link: "placeholder_pdf_link_3",
  },
];

const createEmptyPlaceholder = (): PlaceholderSection => {
  const base: PlaceholderSection = {
    id: "",
    label: "",
    placeholder_title: "",
    placeholder_subtitle: "",
    placeholder_grid_heading: "",
    placeholder_status: "",
    placeholder_owner: "",
    placeholder_details: "",
    placeholder_cta_label: "",
    placeholder_cta_link: "",
    placeholder_progress: "",
    placeholder_progress_pct: "",
    placeholder_footnote: "",
  };

  PLACEHOLDER_GRID_IMAGE_KEYS.forEach((key) => {
    base[key] = "";
  });

  PLACEHOLDER_PDF_GROUPS.forEach((group) => {
    base[group.title] = "";
    base[group.description] = "";
    base[group.link] = "";
  });

  return base;
};

const placeholderHasContent = (section: PlaceholderSection) =>
  Object.values(section).some((value) => value?.trim().length > 0);

export default function App() {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [sectionOrder, setSectionOrder] = useState<string[]>(
    DEFAULT_SECTION_ORDER,
  );
  const [sectionLabels, setSectionLabels] = useState<Record<string, string>>(
    DEFAULT_SECTION_LABELS,
  );
  const [sectionVisibility, setSectionVisibility] = useState<
    Record<string, boolean>
  >(DEFAULT_SECTION_VISIBILITY);
  const [placeholderSections, setPlaceholderSections] = useState<
    PlaceholderSection[]
  >([]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    status: string;
    s3_url: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSectionVisibility = (id: string) => {
    setSectionVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateSectionLabel = (id: string, value: string) => {
    setSectionLabels((prev) => ({ ...prev, [id]: value }));
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    id: string,
  ) => {
    setDraggedSection(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    id: string,
  ) => {
    event.preventDefault();
    if (dragOverSection !== id) {
      setDragOverSection(id);
    }
  };

  const handleDragLeave = (
    event: React.DragEvent<HTMLDivElement>,
    id: string,
  ) => {
    event.preventDefault();
    setDragOverSection((current) => (current === id ? null : current));
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    targetId: string,
  ) => {
    event.preventDefault();
    const draggedId =
      event.dataTransfer.getData("text/plain") || draggedSection;
    if (!draggedId || draggedId === targetId) {
      setDragOverSection(null);
      setDraggedSection(null);
      return;
    }

    const targetRect = event.currentTarget.getBoundingClientRect();
    const shouldInsertAfter =
      event.clientY > targetRect.top + targetRect.height / 2;

    setSectionOrder((previous) => {
      const filtered = previous.filter((id) => id !== draggedId);
      const targetIndex = filtered.indexOf(targetId);
      if (targetIndex === -1) return previous;
      const insertionIndex = Math.max(
        0,
        targetIndex + (shouldInsertAfter ? 1 : 0),
      );
      const updated = [...filtered];
      updated.splice(insertionIndex, 0, draggedId);
      return updated;
    });

    setDragOverSection(null);
    setDraggedSection(null);
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
    setDragOverSection(null);
  };

  const addPlaceholderSection = () => {
    setPlaceholderSections((prev) => [...prev, createEmptyPlaceholder()]);
  };

  const updatePlaceholderSection = (
    index: number,
    field: string,
    value: string,
  ) => {
    setPlaceholderSections((prev) =>
      prev.map((section, idx) =>
        idx === index ? { ...section, [field]: value } : section,
      ),
    );
  };

  const removePlaceholderSection = (index: number) => {
    setPlaceholderSections((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    setResult(null);

    const payload: Record<string, unknown> = {
      ...formData,
      section_order: sectionOrder.filter((id) => sectionVisibility[id]),
      section_labels: sectionLabels,
    };

    const normalizedPlaceholders = placeholderSections
      .map((section) => ({ ...section }))
      .filter(placeholderHasContent);

    if (normalizedPlaceholders.length > 0) {
      payload.placeholder_sections = normalizedPlaceholders;
    }

    try {
      const res = await fetch("/api/generate-branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate branding page");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      console.error(err);
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  const renderSectionFields = (sectionId: string) => {
    switch (sectionId) {
      case "brand":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Name
              </label>
              <input
                type="text"
                value={formData.brand_name || ""}
                onChange={(e) =>
                  handleInputChange("brand_name", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. Acme Corp"
                required
              />
            </div>
            <FileUpload
              label="Brand Logo URL"
              fieldKey="brand_logo_url"
              onUploadComplete={handleInputChange}
              currentUrl={formData.brand_logo_url}
            />
            <FileUpload
              label="Brand Hero Image URL"
              fieldKey="brand_hero_image_url"
              onUploadComplete={handleInputChange}
              currentUrl={formData.brand_hero_image_url}
            />
          </div>
        );
      case "about":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              About Client
            </label>
            <textarea
              value={formData.about_client_about || ""}
              onChange={(e) =>
                handleInputChange("about_client_about", e.target.value)
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Describe the client..."
            />
          </div>
        );
      case "logo":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <FileUpload
                label="Download All Logos"
                fieldKey="logo_download_all_logos"
                onUploadComplete={handleInputChange}
                currentUrl={formData.logo_download_all_logos}
                accept=".zip"
              />
              <FileUpload
                label="Download All Secondary Logos"
                fieldKey="logo_download_all_logos_secondary"
                onUploadComplete={handleInputChange}
                currentUrl={formData.logo_download_all_logos_secondary}
                accept=".zip"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name (for Logo)
                </label>
                <input
                  type="text"
                  value={formData.logo_client_name || ""}
                  onChange={(e) =>
                    handleInputChange("logo_client_name", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo Description
                </label>
                <textarea
                  value={formData.logo_logo_description || ""}
                  onChange={(e) =>
                    handleInputChange("logo_logo_description", e.target.value)
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUpload
                label="Vertical Logo"
                fieldKey="logo_vertical_download_link"
                onUploadComplete={handleInputChange}
                currentUrl={formData.logo_vertical_download_link}
              />
              <FileUpload
                label="Horizontal Logo"
                fieldKey="logo_horizontal_download_link"
                onUploadComplete={handleInputChange}
                currentUrl={formData.logo_horizontal_download_link}
              />
              <FileUpload
                label="Dark Variant"
                fieldKey="logo_variant_dark_download_link"
                onUploadComplete={handleInputChange}
                currentUrl={formData.logo_variant_dark_download_link}
              />
              <FileUpload
                label="Mono Black"
                fieldKey="logo_variant_mono_black_download_link"
                onUploadComplete={handleInputChange}
                currentUrl={formData.logo_variant_mono_black_download_link}
              />
              <FileUpload
                label="Mono White"
                fieldKey="logo_variant_mono_white_download_link"
                onUploadComplete={handleInputChange}
                currentUrl={formData.logo_variant_mono_white_download_link}
              />

              <h4 className="col-span-full text-sm font-semibold text-gray-900 mt-4">
                Favicons
              </h4>
              <FileUpload
                label="Favicon Light"
                fieldKey="logo_favicon_light_download_link"
                onUploadComplete={handleInputChange}
                currentUrl={formData.logo_favicon_light_download_link}
              />
              <FileUpload
                label="Favicon Dark"
                fieldKey="logo_favicon_dark_download_link"
                onUploadComplete={handleInputChange}
                currentUrl={formData.logo_favicon_dark_download_link}
              />
              <FileUpload
                label="Favicon Mono White"
                fieldKey="logo_favicon_mono_white_download_link"
                onUploadComplete={handleInputChange}
                currentUrl={formData.logo_favicon_mono_white_download_link}
              />
              <FileUpload
                label="Favicon Mono Black"
                fieldKey="logo_favicon_mono_black_download_link"
                onUploadComplete={handleInputChange}
                currentUrl={formData.logo_favicon_mono_black_download_link}
              />
            </div>
          </>
        );
      case "colors":
        return (
          <>
            <FileUpload
              label="Download Color Palette (PDF/ASE)"
              fieldKey="colors_download_link"
              onUploadComplete={handleInputChange}
              currentUrl={formData.colors_download_link}
            />

            <h3 className="text-md font-medium text-gray-900 mt-6 mb-4">
              Primary Colors
            </h3>
            <ColorInput
              label="Primary Color 1"
              prefix="colors_primary_1"
              values={formData}
              onChange={handleInputChange}
            />
            <ColorInput
              label="Primary Color 2"
              prefix="colors_primary_2"
              values={formData}
              onChange={handleInputChange}
            />

            <h3 className="text-md font-medium text-gray-900 mt-6 mb-4">
              Secondary Colors
            </h3>
            <ColorInput
              label="Secondary Color 1"
              prefix="colors_secondary_1"
              values={formData}
              onChange={handleInputChange}
            />
            <ColorInput
              label="Secondary Color 2"
              prefix="colors_secondary_2"
              values={formData}
              onChange={handleInputChange}
            />
            <ColorInput
              label="Secondary Color 3"
              prefix="colors_secondary_3"
              values={formData}
              onChange={handleInputChange}
            />
            <ColorInput
              label="Secondary Color 4"
              prefix="colors_secondary_4"
              values={formData}
              onChange={handleInputChange}
            />
          </>
        );
      case "typography":
        return (
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Font Name
              </label>
              <input
                type="text"
                value={formData.typography_primary_font_name || ""}
                onChange={(e) =>
                  handleInputChange(
                    "typography_primary_font_name",
                    e.target.value,
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. Inter"
              />
            </div>
            <FileUpload
              label="Download Fonts (Zip)"
              fieldKey="typography_download_fonts"
              onUploadComplete={handleInputChange}
              currentUrl={formData.typography_download_fonts}
              accept=".zip"
            />
          </div>
        );
      case "illustrations":
        return (
          <>
            <FileUpload
              label="Download All Illustrations"
              fieldKey="illustrations_download_link"
              onUploadComplete={handleInputChange}
              currentUrl={formData.illustrations_download_link}
              accept=".zip"
            />
            <FileUpload
              label="Hero Illustration"
              fieldKey="illustrations_hero_download_link"
              onUploadComplete={handleInputChange}
              currentUrl={formData.illustrations_hero_download_link}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <FileUpload
                  key={num}
                  label={`Tile ${num}`}
                  fieldKey={`illustrations_tile_download_link_${num}`}
                  onUploadComplete={handleInputChange}
                  currentUrl={
                    formData[`illustrations_tile_download_link_${num}`]
                  }
                />
              ))}
            </div>
          </>
        );
      case "images":
        return (
          <>
            <FileUpload
              label="Download All Images"
              fieldKey="images_download_link"
              onUploadComplete={handleInputChange}
              currentUrl={formData.images_download_link}
              accept=".zip"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <FileUpload
                  key={num}
                  label={`Tile ${num}`}
                  fieldKey={`images_tile_download_link_${num}`}
                  onUploadComplete={handleInputChange}
                  currentUrl={formData[`images_tile_download_link_${num}`]}
                />
              ))}
            </div>
          </>
        );
      case "collaterals":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUpload
              label="Download All Collaterals (Zip)"
              fieldKey="collaterals_download_all_collaterals"
              onUploadComplete={handleInputChange}
              currentUrl={formData.collaterals_download_all_collaterals}
              accept=".zip,.rar,.7z"
            />
            <FileUpload
              label="Business Card"
              fieldKey="collaterals_businesscard_download_link"
              onUploadComplete={handleInputChange}
              currentUrl={formData.collaterals_businesscard_download_link}
            />
            <FileUpload
              label="Letterhead"
              fieldKey="collaterals_letterhead_download_link"
              onUploadComplete={handleInputChange}
              currentUrl={formData.collaterals_letterhead_download_link}
            />
            <FileUpload
              label="Email Signature"
              fieldKey="collaterals_emailsignature_download_link"
              onUploadComplete={handleInputChange}
              currentUrl={formData.collaterals_emailsignature_download_link}
            />
            <FileUpload
              label="Proposal"
              fieldKey="collaterals_proposal_link"
              onUploadComplete={handleInputChange}
              currentUrl={formData.collaterals_proposal_link}
            />
          </div>
        );
      case "patterns":
        return (
          <>
            <FileUpload
              label="Download All Patterns"
              fieldKey="patterns_download_link"
              onUploadComplete={handleInputChange}
              currentUrl={formData.patterns_download_link}
              accept=".zip"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <FileUpload
                label="Large Pattern 1"
                fieldKey="patterns_large_download_link_1"
                onUploadComplete={handleInputChange}
                currentUrl={formData.patterns_large_download_link_1}
              />
              <FileUpload
                label="Large Pattern 2"
                fieldKey="patterns_large_download_link_2"
                onUploadComplete={handleInputChange}
                currentUrl={formData.patterns_large_download_link_2}
              />
              <FileUpload
                label="Small Pattern 1"
                fieldKey="patterns_small_download_link_1"
                onUploadComplete={handleInputChange}
                currentUrl={formData.patterns_small_download_link_1}
              />
              <FileUpload
                label="Small Pattern 2"
                fieldKey="patterns_small_download_link_2"
                onUploadComplete={handleInputChange}
                currentUrl={formData.patterns_small_download_link_2}
              />
              <FileUpload
                label="Small Pattern 3"
                fieldKey="patterns_small_download_link_3"
                onUploadComplete={handleInputChange}
                currentUrl={formData.patterns_small_download_link_3}
              />
              <FileUpload
                label="Small Pattern 4"
                fieldKey="patterns_small_download_link_4"
                onUploadComplete={handleInputChange}
                currentUrl={formData.patterns_small_download_link_4}
              />
            </div>
          </>
        );
      case "guidelines":
        return (
          <FileUpload
            label="Brand Guidelines PDF"
            fieldKey="guidelines_download_link"
            onUploadComplete={handleInputChange}
            currentUrl={formData.guidelines_download_link}
            accept=".pdf"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-4">
            Branding Page Generator
          </h1>
          <p className="text-lg text-gray-600">
            Upload assets and generate a client branding page in seconds.
          </p>
        </div>

        <form id="branding-form" onSubmit={handleSubmit} className="space-y-6">
          <Section
            title="Placeholder sections"
            description="Add temporary cards with reference content."
          >
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={addPlaceholderSection}
                className="inline-flex items-center gap-1 rounded-full border border-indigo-300 bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 ml-auto"
              >
                <Plus className="h-4 w-4" />
                Add placeholder
              </button>
            </div>

            {placeholderSections.length === 0 ? (
              <p className="text-sm text-gray-500">
                No placeholders added yet.
              </p>
            ) : (
              <div className="space-y-4">
                {placeholderSections.map((placeholder, index) => (
                  <div
                    key={`${placeholder.id || "placeholder"}-${index}`}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Placeholder #{index + 1}
                        </p>
                        <p className="text-xs text-gray-500">
                          Appears after the sections above.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePlaceholderSection(index)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          ID
                        </label>
                        <input
                          type="text"
                          value={placeholder.id}
                          onChange={(event) =>
                            updatePlaceholderSection(
                              index,
                              "id",
                              event.target.value,
                            )
                          }
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          Label
                        </label>
                        <input
                          type="text"
                          value={placeholder.label}
                          onChange={(event) =>
                            updatePlaceholderSection(
                              index,
                              "label",
                              event.target.value,
                            )
                          }
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          Title
                        </label>
                        <input
                          type="text"
                          value={placeholder.placeholder_title}
                          onChange={(event) =>
                            updatePlaceholderSection(
                              index,
                              "placeholder_title",
                              event.target.value,
                            )
                          }
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          Subtitle
                        </label>
                        <input
                          type="text"
                          value={placeholder.placeholder_subtitle}
                          onChange={(event) =>
                            updatePlaceholderSection(
                              index,
                              "placeholder_subtitle",
                              event.target.value,
                            )
                          }
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          Grid heading
                        </label>
                        <input
                          type="text"
                          value={placeholder.placeholder_grid_heading}
                          onChange={(event) =>
                            updatePlaceholderSection(
                              index,
                              "placeholder_grid_heading",
                              event.target.value,
                            )
                          }
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          Status
                        </label>
                        <input
                          type="text"
                          value={placeholder.placeholder_status}
                          onChange={(event) =>
                            updatePlaceholderSection(
                              index,
                              "placeholder_status",
                              event.target.value,
                            )
                          }
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          Owner
                        </label>
                        <input
                          type="text"
                          value={placeholder.placeholder_owner}
                          onChange={(event) =>
                            updatePlaceholderSection(
                              index,
                              "placeholder_owner",
                              event.target.value,
                            )
                          }
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-gray-500">
                          Details
                        </label>
                        <textarea
                          value={placeholder.placeholder_details}
                          onChange={(event) =>
                            updatePlaceholderSection(
                              index,
                              "placeholder_details",
                              event.target.value,
                            )
                          }
                          rows={3}
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                        Grid images
                      </p>
                      <div className="grid gap-3 md:grid-cols-2">
                        {PLACEHOLDER_GRID_IMAGE_KEYS.map((key) => (
                          <div key={key}>
                            <label className="text-xs font-medium text-gray-500">
                              Image URL
                            </label>
                            <input
                              type="url"
                              value={placeholder[key]}
                              onChange={(event) =>
                                updatePlaceholderSection(
                                  index,
                                  key,
                                  event.target.value,
                                )
                              }
                              placeholder="https://..."
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                        PDF references
                      </p>
                      <div className="grid gap-3 md:grid-cols-3">
                        {PLACEHOLDER_PDF_GROUPS.map((group) => (
                          <div key={group.title} className="space-y-2">
                            <label className="text-xs font-medium text-gray-500">
                              Title
                            </label>
                            <input
                              type="text"
                              value={placeholder[group.title]}
                              onChange={(event) =>
                                updatePlaceholderSection(
                                  index,
                                  group.title,
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                            <label className="text-xs font-medium text-gray-500">
                              Description
                            </label>
                            <input
                              type="text"
                              value={placeholder[group.description]}
                              onChange={(event) =>
                                updatePlaceholderSection(
                                  index,
                                  group.description,
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                            <label className="text-xs font-medium text-gray-500">
                              Link
                            </label>
                            <input
                              type="url"
                              value={placeholder[group.link]}
                              onChange={(event) =>
                                updatePlaceholderSection(
                                  index,
                                  group.link,
                                  event.target.value,
                                )
                              }
                              placeholder="https://..."
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          CTA label
                        </label>
                        <input
                          type="text"
                          value={placeholder.placeholder_cta_label}
                          onChange={(event) =>
                            updatePlaceholderSection(
                              index,
                              "placeholder_cta_label",
                              event.target.value,
                            )
                          }
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          CTA link
                        </label>
                        <input
                          type="url"
                          value={placeholder.placeholder_cta_link}
                          onChange={(event) =>
                            updatePlaceholderSection(
                              index,
                              "placeholder_cta_link",
                              event.target.value,
                            )
                          }
                          placeholder="https://..."
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          Progress label
                        </label>
                        <input
                          type="text"
                          value={placeholder.placeholder_progress}
                          onChange={(event) =>
                            updatePlaceholderSection(
                              index,
                              "placeholder_progress",
                              event.target.value,
                            )
                          }
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          Progress %
                        </label>
                        <input
                          type="text"
                          value={placeholder.placeholder_progress_pct}
                          onChange={(event) =>
                            updatePlaceholderSection(
                              index,
                              "placeholder_progress_pct",
                              event.target.value,
                            )
                          }
                          placeholder="e.g. 45"
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-gray-500">
                          Footnote
                        </label>
                        <input
                          type="text"
                          value={placeholder.placeholder_footnote}
                          onChange={(event) =>
                            updatePlaceholderSection(
                              index,
                              "placeholder_footnote",
                              event.target.value,
                            )
                          }
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <div className="space-y-4">
            {sectionOrder.map((sectionId, index) => {
              const definition = SECTION_DEFINITIONS.find(
                (section) => section.id === sectionId,
              );
              if (!definition) return null;
              const isVisible = sectionVisibility[sectionId];
              const sectionContent = renderSectionFields(sectionId);

              return (
                <div
                  key={sectionId}
                  onDragOver={(event) => handleDragOver(event, sectionId)}
                  onDragEnter={(event) => handleDragOver(event, sectionId)}
                  onDragLeave={(event) => handleDragLeave(event, sectionId)}
                  onDrop={(event) => handleDrop(event, sectionId)}
                  className={`rounded-3xl transition ${
                    dragOverSection === sectionId
                      ? "ring-2 ring-indigo-300 shadow-lg"
                      : ""
                  }`}
                >
                  <Section
                    title={
                      <div className="flex items-center gap-2">
                        <span>{definition.title}</span>
                        <span className="text-xs text-gray-400">
                          #{index + 1}
                        </span>
                      </div>
                    }
                    description={
                      <div className="mt-3 space-y-1">
                        <label
                          htmlFor={`section-label-${sectionId}`}
                          className="text-xs font-semibold text-gray-500"
                        >
                          Label
                        </label>
                        <input
                          id={`section-label-${sectionId}`}
                          type="text"
                          value={sectionLabels[sectionId]}
                          onChange={(event) =>
                            updateSectionLabel(sectionId, event.target.value)
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                    }
                    headerActions={
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => toggleSectionVisibility(sectionId)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          {isVisible ? "Visible" : "Hidden"}
                        </label>
                        <div
                          draggable
                          onDragStart={(event) =>
                            handleDragStart(event, sectionId)
                          }
                          onDragEnd={handleDragEnd}
                          className="cursor-grab text-gray-400 hover:text-gray-600"
                          aria-label="Drag to reorder"
                        >
                          <GripVertical className="h-5 w-5" />
                        </div>
                      </div>
                    }
                    className={draggedSection === sectionId ? "opacity-90" : ""}
                  >
                    {isVisible ? (
                      sectionContent
                    ) : (
                      <p className="text-sm text-gray-500">
                        Toggle this section on to configure its content.
                      </p>
                    )}
                  </Section>
                </div>
              );
            })}
          </div>
        </form>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg flex justify-end items-center gap-4 z-50">
          {error && (
            <div className="flex items-center text-red-600 text-sm mr-auto">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}
          <button
            type="submit"
            form="branding-form"
            disabled={generating}
            className={`flex items-center gap-2 px-8 py-3 rounded-lg text-white font-semibold text-lg shadow-md transition-all
              ${
                generating
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:transform active:scale-95"
              }`}
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Branding Page"
            )}
          </button>
        </div>

        {result && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Success!
              </h2>
              <p className="text-gray-600 mb-6">
                Your branding page has been generated successfully.
              </p>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 break-all">
                <a
                  href={result.s3_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline font-medium"
                >
                  {result.s3_url}
                </a>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setResult(null)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Close
                </button>
                <a
                  href={result.s3_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 font-medium"
                >
                  Open Page
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </div>
      <div className="h-20" />
    </div>
  );
}
