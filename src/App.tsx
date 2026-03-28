import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { ColorInput } from './components/ColorInput';
import { Section } from './components/Section';
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

type PlaceholderSection = Record<string, string>;

const SECTION_DEFINITIONS = [
  { id: 'about', title: 'About Section' },
  { id: 'logo', title: 'Logo Design' },
  { id: 'colors', title: 'Color Palette' },
  { id: 'typography', title: 'Typography' },
  { id: 'illustrations', title: 'Illustrations' },
  { id: 'images', title: 'Images' },
  { id: 'patterns', title: 'Patterns' },
  { id: 'collaterals', title: 'Collaterals' },
  { id: 'guidelines', title: 'Brand Guidelines' },
];

const DEFAULT_SECTION_LABELS: Record<string, string> = {
  about: '(01) About The Brand',
  logo: '(02) Logo Design',
  colors: '(03) Color Palette',
  typography: '(04) Typography',
  illustrations: '(05) Illustrations',
  images: '(06) Images',
  patterns: '(07) Patterns',
  collaterals: '(08) Collaterals',
  guidelines: '(09) Brand Guidelines',
};

const DEFAULT_SECTION_ORDER = SECTION_DEFINITIONS.map((section) => section.id);

const PLACEHOLDER_GRID_IMAGE_KEYS = Array.from({ length: 6 }, (_, index) => `placeholder_grid_image_${index + 1}`);
const PLACEHOLDER_PDF_GROUPS = [
  {
    title: 'placeholder_pdf_title_1',
    description: 'placeholder_pdf_description_1',
    link: 'placeholder_pdf_link_1',
  },
  {
    title: 'placeholder_pdf_title_2',
    description: 'placeholder_pdf_description_2',
    link: 'placeholder_pdf_link_2',
  },
  {
    title: 'placeholder_pdf_title_3',
    description: 'placeholder_pdf_description_3',
    link: 'placeholder_pdf_link_3',
  },
];

const createEmptyPlaceholder = (): PlaceholderSection => {
  const base: PlaceholderSection = {
    id: '',
    label: '',
    placeholder_title: '',
    placeholder_subtitle: '',
    placeholder_grid_heading: '',
    placeholder_status: '',
    placeholder_owner: '',
    placeholder_details: '',
    placeholder_cta_label: '',
    placeholder_cta_link: '',
    placeholder_progress: '',
    placeholder_progress_pct: '',
    placeholder_footnote: '',
  };

  PLACEHOLDER_GRID_IMAGE_KEYS.forEach((key) => {
    base[key] = '';
  });

  PLACEHOLDER_PDF_GROUPS.forEach((group) => {
    base[group.title] = '';
    base[group.description] = '';
    base[group.link] = '';
  });

  return base;
};

const placeholderHasContent = (section: PlaceholderSection) =>
  Object.values(section).some((value) => value?.trim().length > 0);

export default function App() {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_SECTION_ORDER);
  const [sectionLabels, setSectionLabels] = useState<Record<string, string>>(DEFAULT_SECTION_LABELS);
  const [placeholderSections, setPlaceholderSections] = useState<PlaceholderSection[]>([]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ status: string; s3_url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSection = (id: string) => {
    setSectionOrder((previous) => {
      if (previous.includes(id)) {
        return previous.filter((sectionId) => sectionId !== id);
      }
      return [...previous, id];
    });
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    setSectionOrder((previous) => {
      const index = previous.indexOf(id);
      if (index === -1) return previous;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const updateSectionLabel = (id: string, value: string) => {
    setSectionLabels((prev) => ({ ...prev, [id]: value }));
  };

  const addPlaceholderSection = () => {
    setPlaceholderSections((prev) => [...prev, createEmptyPlaceholder()]);
  };

  const updatePlaceholderSection = (index: number, field: string, value: string) => {
    setPlaceholderSections((prev) =>
      prev.map((section, idx) => (idx === index ? { ...section, [field]: value } : section)),
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
      section_order: sectionOrder,
      section_labels: sectionLabels,
    };

    const normalizedPlaceholders = placeholderSections
      .map((section) => ({ ...section }))
      .filter(placeholderHasContent);

    if (normalizedPlaceholders.length > 0) {
      payload.placeholder_sections = normalizedPlaceholders;
    }

    try {
      const res = await fetch('/api/generate-branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate branding page');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-4">Branding Page Generator</h1>
          <p className="text-lg text-gray-600">Upload assets and generate a client branding page in seconds.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title="Page Structure" defaultOpen>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Visible sections &amp; order</h3>
                <p className="text-sm text-gray-500">
                  Toggle which sections should appear on the generated branding page and arrange them in your
                  preferred order.
                </p>
                <div className="mt-4 space-y-3">
                  {SECTION_DEFINITIONS.map((section) => {
                    const isIncluded = sectionOrder.includes(section.id);
                    const currentIndex = sectionOrder.indexOf(section.id);
                    return (
                      <div
                        key={section.id}
                        className="grid gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 md:grid-cols-[auto_1fr_auto]"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isIncluded}
                            onChange={() => toggleSection(section.id)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm font-medium text-gray-900">{section.title}</span>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
                          <input
                            type="text"
                            value={sectionLabels[section.id]}
                            onChange={(event) => updateSectionLabel(section.id, event.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                          />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                            onClick={() => moveSection(section.id, 'up')}
                            disabled={!isIncluded || currentIndex <= 0}
                            className="rounded-full border border-gray-200 bg-white p-1 text-gray-500 transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(section.id, 'down')}
                            disabled={!isIncluded || currentIndex === -1 || currentIndex >= sectionOrder.length - 1}
                            className="rounded-full border border-gray-200 bg-white p-1 text-gray-500 transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Placeholder sections</h3>
                    <p className="text-sm text-gray-500">Add temporary cards with reference content.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addPlaceholderSection}
                    className="inline-flex items-center gap-1 rounded-full border border-indigo-300 bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    <Plus className="h-4 w-4" />
                    Add placeholder
                  </button>
                </div>

                {placeholderSections.length === 0 ? (
                  <p className="text-sm text-gray-500">No placeholders added yet.</p>
                ) : (
                  <div className="space-y-4">
                    {placeholderSections.map((placeholder, index) => (
                      <div key={`${placeholder.id || 'placeholder'}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Placeholder #{index + 1}</p>
                            <p className="text-xs text-gray-500">Appears after the sections above.</p>
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
                            <label className="text-xs font-medium text-gray-500">ID</label>
                            <input
                              type="text"
                              value={placeholder.id}
                              onChange={(event) => updatePlaceholderSection(index, 'id', event.target.value)}
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">Label</label>
                            <input
                              type="text"
                              value={placeholder.label}
                              onChange={(event) => updatePlaceholderSection(index, 'label', event.target.value)}
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">Title</label>
                            <input
                              type="text"
                              value={placeholder.placeholder_title}
                              onChange={(event) => updatePlaceholderSection(index, 'placeholder_title', event.target.value)}
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">Subtitle</label>
                            <input
                              type="text"
                              value={placeholder.placeholder_subtitle}
                              onChange={(event) => updatePlaceholderSection(index, 'placeholder_subtitle', event.target.value)}
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">Grid heading</label>
                            <input
                              type="text"
                              value={placeholder.placeholder_grid_heading}
                              onChange={(event) => updatePlaceholderSection(index, 'placeholder_grid_heading', event.target.value)}
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div>
                            <label className="text-xs font-medium text-gray-500">Status</label>
                            <input
                              type="text"
                              value={placeholder.placeholder_status}
                              onChange={(event) => updatePlaceholderSection(index, 'placeholder_status', event.target.value)}
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">Owner</label>
                            <input
                              type="text"
                              value={placeholder.placeholder_owner}
                              onChange={(event) => updatePlaceholderSection(index, 'placeholder_owner', event.target.value)}
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-medium text-gray-500">Details</label>
                            <textarea
                              value={placeholder.placeholder_details}
                              onChange={(event) => updatePlaceholderSection(index, 'placeholder_details', event.target.value)}
                              rows={3}
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Grid images</p>
                          <div className="grid gap-3 md:grid-cols-2">
                            {PLACEHOLDER_GRID_IMAGE_KEYS.map((key) => (
                              <div key={key}>
                                <label className="text-xs font-medium text-gray-500">Image URL</label>
                                <input
                                  type="url"
                                  value={placeholder[key]}
                                  onChange={(event) => updatePlaceholderSection(index, key, event.target.value)}
                                  placeholder="https://..."
                                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">PDF references</p>
                          <div className="grid gap-3 md:grid-cols-3">
                            {PLACEHOLDER_PDF_GROUPS.map((group) => (
                              <div key={group.title} className="space-y-2">
                                <label className="text-xs font-medium text-gray-500">Title</label>
                                <input
                                  type="text"
                                  value={placeholder[group.title]}
                                  onChange={(event) => updatePlaceholderSection(index, group.title, event.target.value)}
                                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                                <label className="text-xs font-medium text-gray-500">Description</label>
                                <input
                                  type="text"
                                  value={placeholder[group.description]}
                                  onChange={(event) =>
                                    updatePlaceholderSection(index, group.description, event.target.value)
                                  }
                                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                                <label className="text-xs font-medium text-gray-500">Link</label>
                                <input
                                  type="url"
                                  value={placeholder[group.link]}
                                  onChange={(event) => updatePlaceholderSection(index, group.link, event.target.value)}
                                  placeholder="https://..."
                                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div>
                            <label className="text-xs font-medium text-gray-500">CTA label</label>
                            <input
                              type="text"
                              value={placeholder.placeholder_cta_label}
                              onChange={(event) => updatePlaceholderSection(index, 'placeholder_cta_label', event.target.value)}
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">CTA link</label>
                            <input
                              type="url"
                              value={placeholder.placeholder_cta_link}
                              onChange={(event) => updatePlaceholderSection(index, 'placeholder_cta_link', event.target.value)}
                              placeholder="https://..."
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">Progress label</label>
                            <input
                              type="text"
                              value={placeholder.placeholder_progress}
                              onChange={(event) => updatePlaceholderSection(index, 'placeholder_progress', event.target.value)}
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">Progress %</label>
                            <input
                              type="text"
                              value={placeholder.placeholder_progress_pct}
                              onChange={(event) =>
                                updatePlaceholderSection(index, 'placeholder_progress_pct', event.target.value)
                              }
                              placeholder="e.g. 45"
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-medium text-gray-500">Footnote</label>
                            <input
                              type="text"
                              value={placeholder.placeholder_footnote}
                              onChange={(event) => updatePlaceholderSection(index, 'placeholder_footnote', event.target.value)}
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* Brand Info */}
          <Section title="Brand Information" defaultOpen>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                <input
                  type="text"
                  value={formData.brand_name || ''}
                  onChange={(e) => handleInputChange('brand_name', e.target.value)}
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
          </Section>

          {/* About */}
          <Section title="About Section">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">About Client</label>
              <textarea
                value={formData.about_client_about || ''}
                onChange={(e) => handleInputChange('about_client_about', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe the client..."
              />
            </div>
          </Section>

          {/* Collaterals */}
          <Section title="Collaterals">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUpload label="Download All Collaterals (Zip)" fieldKey="collaterals_download_all_collaterals" onUploadComplete={handleInputChange} currentUrl={formData.collaterals_download_all_collaterals} accept=".zip,.rar,.7z" />
              <FileUpload label="Business Card" fieldKey="collaterals_businesscard_download_link" onUploadComplete={handleInputChange} currentUrl={formData.collaterals_businesscard_download_link} />
              <FileUpload label="Letterhead" fieldKey="collaterals_letterhead_download_link" onUploadComplete={handleInputChange} currentUrl={formData.collaterals_letterhead_download_link} />
              <FileUpload label="Email Signature" fieldKey="collaterals_emailsignature_download_link" onUploadComplete={handleInputChange} currentUrl={formData.collaterals_emailsignature_download_link} />
              <FileUpload label="Proposal" fieldKey="collaterals_proposal_link" onUploadComplete={handleInputChange} currentUrl={formData.collaterals_proposal_link} />
            </div>
          </Section>

          {/* Colors */}
          <Section title="Colors">
            <FileUpload label="Download Color Palette (PDF/ASE)" fieldKey="colors_download_link" onUploadComplete={handleInputChange} currentUrl={formData.colors_download_link} />

            <h3 className="text-md font-medium text-gray-900 mt-6 mb-4">Primary Colors</h3>
            <ColorInput label="Primary Color 1" prefix="colors_primary_1" values={formData} onChange={handleInputChange} />
            <ColorInput label="Primary Color 2" prefix="colors_primary_2" values={formData} onChange={handleInputChange} />

            <h3 className="text-md font-medium text-gray-900 mt-6 mb-4">Secondary Colors</h3>
            <ColorInput label="Secondary Color 1" prefix="colors_secondary_1" values={formData} onChange={handleInputChange} />
            <ColorInput label="Secondary Color 2" prefix="colors_secondary_2" values={formData} onChange={handleInputChange} />
            <ColorInput label="Secondary Color 3" prefix="colors_secondary_3" values={formData} onChange={handleInputChange} />
            <ColorInput label="Secondary Color 4" prefix="colors_secondary_4" values={formData} onChange={handleInputChange} />
          </Section>

          {/* Guidelines */}
          <Section title="Guidelines">
            <FileUpload label="Brand Guidelines PDF" fieldKey="guidelines_download_link" onUploadComplete={handleInputChange} currentUrl={formData.guidelines_download_link} accept=".pdf" />
          </Section>

          {/* Illustrations */}
          <Section title="Illustrations">
            <FileUpload label="Download All Illustrations" fieldKey="illustrations_download_link" onUploadComplete={handleInputChange} currentUrl={formData.illustrations_download_link} accept=".zip" />
            <FileUpload label="Hero Illustration" fieldKey="illustrations_hero_download_link" onUploadComplete={handleInputChange} currentUrl={formData.illustrations_hero_download_link} />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <FileUpload
                  key={num}
                  label={`Tile ${num}`}
                  fieldKey={`illustrations_tile_download_link_${num}`}
                  onUploadComplete={handleInputChange}
                  currentUrl={formData[`illustrations_tile_download_link_${num}`]}
                />
              ))}
            </div>
          </Section>

          {/* Images */}
          <Section title="Images">
            <FileUpload label="Download All Images" fieldKey="images_download_link" onUploadComplete={handleInputChange} currentUrl={formData.images_download_link} accept=".zip" />
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
          </Section>

          {/* Logos */}
          <Section title="Logos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <FileUpload label="Download All Logos" fieldKey="logo_download_all_logos" onUploadComplete={handleInputChange} currentUrl={formData.logo_download_all_logos} accept=".zip" />
              <FileUpload label="Download All Secondary Logos" fieldKey="logo_download_all_logos_secondary" onUploadComplete={handleInputChange} currentUrl={formData.logo_download_all_logos_secondary} accept=".zip" />
            </div>

            <div className="grid grid-cols-1 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name (for Logo)</label>
                <input
                  type="text"
                  value={formData.logo_client_name || ''}
                  onChange={(e) => handleInputChange('logo_client_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo Description</label>
                <textarea
                  value={formData.logo_logo_description || ''}
                  onChange={(e) => handleInputChange('logo_logo_description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUpload label="Vertical Logo" fieldKey="logo_vertical_download_link" onUploadComplete={handleInputChange} currentUrl={formData.logo_vertical_download_link} />
              <FileUpload label="Horizontal Logo" fieldKey="logo_horizontal_download_link" onUploadComplete={handleInputChange} currentUrl={formData.logo_horizontal_download_link} />
              <FileUpload label="Dark Variant" fieldKey="logo_variant_dark_download_link" onUploadComplete={handleInputChange} currentUrl={formData.logo_variant_dark_download_link} />
              <FileUpload label="Mono Black" fieldKey="logo_variant_mono_black_download_link" onUploadComplete={handleInputChange} currentUrl={formData.logo_variant_mono_black_download_link} />
              <FileUpload label="Mono White" fieldKey="logo_variant_mono_white_download_link" onUploadComplete={handleInputChange} currentUrl={formData.logo_variant_mono_white_download_link} />

              <h4 className="col-span-full text-sm font-semibold text-gray-900 mt-4">Favicons</h4>
              <FileUpload label="Favicon Light" fieldKey="logo_favicon_light_download_link" onUploadComplete={handleInputChange} currentUrl={formData.logo_favicon_light_download_link} />
              <FileUpload label="Favicon Dark" fieldKey="logo_favicon_dark_download_link" onUploadComplete={handleInputChange} currentUrl={formData.logo_favicon_dark_download_link} />
              <FileUpload label="Favicon Mono White" fieldKey="logo_favicon_mono_white_download_link" onUploadComplete={handleInputChange} currentUrl={formData.logo_favicon_mono_white_download_link} />
              <FileUpload label="Favicon Mono Black" fieldKey="logo_favicon_mono_black_download_link" onUploadComplete={handleInputChange} currentUrl={formData.logo_favicon_mono_black_download_link} />
            </div>
          </Section>

          {/* Patterns */}
          <Section title="Patterns">
            <FileUpload label="Download All Patterns" fieldKey="patterns_download_link" onUploadComplete={handleInputChange} currentUrl={formData.patterns_download_link} accept=".zip" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <FileUpload label="Large Pattern 1" fieldKey="patterns_large_download_link_1" onUploadComplete={handleInputChange} currentUrl={formData.patterns_large_download_link_1} />
              <FileUpload label="Large Pattern 2" fieldKey="patterns_large_download_link_2" onUploadComplete={handleInputChange} currentUrl={formData.patterns_large_download_link_2} />
              <FileUpload label="Small Pattern 1" fieldKey="patterns_small_download_link_1" onUploadComplete={handleInputChange} currentUrl={formData.patterns_small_download_link_1} />
              <FileUpload label="Small Pattern 2" fieldKey="patterns_small_download_link_2" onUploadComplete={handleInputChange} currentUrl={formData.patterns_small_download_link_2} />
              <FileUpload label="Small Pattern 3" fieldKey="patterns_small_download_link_3" onUploadComplete={handleInputChange} currentUrl={formData.patterns_small_download_link_3} />
              <FileUpload label="Small Pattern 4" fieldKey="patterns_small_download_link_4" onUploadComplete={handleInputChange} currentUrl={formData.patterns_small_download_link_4} />
            </div>
          </Section>

          {/* Typography */}
          <Section title="Typography">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Font Name</label>
                <input
                  type="text"
                  value={formData.typography_primary_font_name || ''}
                  onChange={(e) => handleInputChange('typography_primary_font_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. Inter"
                />
              </div>
              <FileUpload label="Download Fonts (Zip)" fieldKey="typography_download_fonts" onUploadComplete={handleInputChange} currentUrl={formData.typography_download_fonts} accept=".zip" />
            </div>
          </Section>

          {/* Submit Action */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg flex justify-end items-center gap-4 z-50">
            {error && (
              <div className="flex items-center text-red-600 text-sm mr-auto">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={generating}
              className={`flex items-center gap-2 px-8 py-3 rounded-lg text-white font-semibold text-lg shadow-md transition-all
                ${generating
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:transform active:scale-95'
                }`}
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Branding Page'
              )}
            </button>
          </div>
        </form>

        {/* Success Modal */}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
              <p className="text-gray-600 mb-6">Your branding page has been generated successfully.</p>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 break-all">
                <a href={result.s3_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">
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
      {/* Spacer for fixed footer */}
      <div className="h-20" />
    </div>
  );
}
