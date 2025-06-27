"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Tag, Languages, Layers, Shield } from "lucide-react";
import AddCategoryModal from "@/components/admin/metadata/AddCategoryModal";
import AddGenreModal from "@/components/admin/metadata/AddGenreModal";
import AddLanguageModal from "@/components/admin/metadata/AddLanguageModal";
import AddFormatModal from "@/components/admin/metadata/AddFormatModal";
import AddAgeRatingModal from "@/components/admin/metadata/AddAgeRatingModal";
import { api } from "@/services/api";
import Loader from "@/components/Loader";

const TABS = [
  { label: "Categories", icon: BookOpen },
  { label: "Genres", icon: Tag },
  { label: "Languages", icon: Languages },
  { label: "Formats", icon: Layers },
  { label: "Age Ratings", icon: Shield },
];

type Category = {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdByName?: string;
  createdByEmail?: string;
};
type Genre = { id: string; name: string };
type Language = { id: string; name: string };
type Format = { id: string; name: string };
type AgeRating = { name: string };

export default function MetaDataPage() {
  const [activeTab, setActiveTab] = useState("Categories");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddGenreModal, setShowAddGenreModal] = useState(false);
  const [showAddLanguageModal, setShowAddLanguageModal] = useState(false);
  const [showAddFormatModal, setShowAddFormatModal] = useState(false);
  const [showAddAgeRatingModal, setShowAddAgeRatingModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [ageRatings, setAgeRatings] = useState<AgeRating[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch all metadata
  const fetchMetadata = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.fetchMetadata();
      if (res && res.success && res.data) {
        console.log("Metadata fetch: ", res.data)
        setCategories(res.data.categories || []);
        setGenres(res.data.genres || []);
        setLanguages(res.data.languages || []);
        setFormats(res.data.formats || []);
        setAgeRatings(res.data.ageRatings || []);
      } else {
        setError(res?.message || "Failed to fetch metadata");
      }
    } catch (err) {
      console.error('Error fetching metadata:', err);
      setError("Failed to fetch metadata");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Filtered data for each tab
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredGenres = genres.filter(genre =>
    genre.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredFormats = formats.filter(fmt =>
    fmt.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAgeRatings = ageRatings.filter(rating =>
    rating.name.toLowerCase().includes(search.toLowerCase())
  );

  // Table renderers
  const renderCategoriesTable = () => (
    <table className="w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
          <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Active</th>
          <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Created At</th>
          <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Updated At</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Created By</th>
          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {filteredCategories.map((cat) => (
          <tr key={cat.id} className="hover:bg-gray-50 transition">
            <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
            <td className="px-4 py-3 text-gray-700">{cat.description || '-'}</td>
            <td className="px-4 py-3 text-center">
              {cat.isActive === undefined ? '-' : (
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{cat.isActive ? 'Active' : 'Inactive'}</span>
              )}
            </td>
            <td className="px-4 py-3 text-center text-gray-500">{cat.createdAt || '-'}</td>
            <td className="px-4 py-3 text-center text-gray-500">{cat.updatedAt || '-'}</td>
            <td className="px-4 py-3 text-left text-gray-700">{cat.createdByName || '-'}</td>
            <td className="px-4 py-3 text-left text-gray-700">{cat.createdByEmail || '-'}</td>
          </tr>
        ))}
        {filteredCategories.length === 0 && (
          <tr>
            <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No categories found.</td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderGenresTable = () => (
    <table className="w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {filteredGenres.map((genre) => (
          <tr key={genre.id} className="hover:bg-gray-50 transition">
            <td className="px-4 py-3 font-medium text-gray-900">{genre.name}</td>
          </tr>
        ))}
        {filteredGenres.length === 0 && (
          <tr>
            <td colSpan={1} className="px-4 py-8 text-center text-gray-400">No genres found.</td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderLanguagesTable = () => (
    <table className="w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {filteredLanguages.map((lang) => (
          <tr key={lang.id} className="hover:bg-gray-50 transition">
            <td className="px-4 py-3 font-medium text-gray-900">{lang.name}</td>
          </tr>
        ))}
        {filteredLanguages.length === 0 && (
          <tr>
            <td colSpan={1} className="px-4 py-8 text-center text-gray-400">No languages found.</td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderFormatsTable = () => (
    <table className="w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {filteredFormats.map((fmt) => (
          <tr key={fmt.id} className="hover:bg-gray-50 transition">
            <td className="px-4 py-3 font-medium text-gray-900">{fmt.name}</td>
          </tr>
        ))}
        {filteredFormats.length === 0 && (
          <tr>
            <td colSpan={1} className="px-4 py-8 text-center text-gray-400">No formats found.</td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderAgeRatingsTable = () => (
    <table className="w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {filteredAgeRatings.map((rating, index) => (
          <tr key={index} className="hover:bg-gray-50 transition">
            <td className="px-4 py-3 font-medium text-gray-900">{rating.name}</td>
          </tr>
        ))}
        {filteredAgeRatings.length === 0 && (
          <tr>
            <td colSpan={1} className="px-4 py-8 text-center text-gray-400">No age ratings found.</td>
          </tr>
        )}
      </tbody>
    </table>
  );

  // Tab summary counts
  const tabCounts = {
    Categories: categories.length,
    Genres: genres.length,
    Languages: languages.length,
    Formats: formats.length,
    "Age Ratings": ageRatings.length,
  };

  return (
    loading ? (
      <Loader title="Loading Metadata" message="Fetching all meta data..." />
    ) : error ? (
      <div className="w-full px-6 py-12 text-center text-red-500">{error}</div>
    ) : (
      <div className="w-full px-0 md:px-6">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Meta Data</h1>
        {/* Sticky tab bar */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-200 flex gap-4 mb-8 px-4 py-2">
          {TABS.map(tab => (
            <button
              key={tab.label}
              className={`flex items-center gap-2 px-5 py-2 text-base font-semibold border-b-2 transition-all focus:outline-none rounded-t-lg ${
                activeTab === tab.label
                  ? "border-indigo-600 text-indigo-700 bg-indigo-50 shadow"
                  : "border-transparent text-gray-500 hover:text-indigo-600"
              }`}
              onClick={() => {
                setActiveTab(tab.label);
                setSearch("");
              }}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
              <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                {tabCounts[tab.label as keyof typeof tabCounts]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between mb-8 px-4">
          <Input
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-72"
          />
          {activeTab === "Categories" && (
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setShowAddCategoryModal(true)}>
              Add Category
            </Button>
          )}
          {activeTab === "Genres" && (
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setShowAddGenreModal(true)}>
              Add Genre
            </Button>
          )}
          {activeTab === "Languages" && (
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setShowAddLanguageModal(true)}>
              Add Language
            </Button>
          )}
          {activeTab === "Formats" && (
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setShowAddFormatModal(true)}>
              Add Format
            </Button>
          )}
          {activeTab === "Age Ratings" && (
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setShowAddAgeRatingModal(true)}>
              Add Age Rating
            </Button>
          )}
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-indigo-50 shadow-lg min-h-[300px] w-full px-4 py-8 overflow-x-auto">
          {activeTab === "Categories"
            ? renderCategoriesTable()
            : activeTab === "Genres"
            ? renderGenresTable()
            : activeTab === "Languages"
            ? renderLanguagesTable()
            : activeTab === "Formats"
            ? renderFormatsTable()
            : renderAgeRatingsTable()}
        </div>
        
        {/* Modals */}
        <AddCategoryModal
          open={showAddCategoryModal}
          onClose={() => setShowAddCategoryModal(false)}
          onSuccess={() => {
            setShowAddCategoryModal(false);
            fetchMetadata();
          }}
        />
        <AddGenreModal
          open={showAddGenreModal}
          onClose={() => setShowAddGenreModal(false)}
          onSuccess={() => {
            setShowAddGenreModal(false);
            fetchMetadata();
          }}
        />
        <AddLanguageModal
          open={showAddLanguageModal}
          onClose={() => setShowAddLanguageModal(false)}
          onSuccess={() => {
            setShowAddLanguageModal(false);
            fetchMetadata();
          }}
        />
        <AddFormatModal
          open={showAddFormatModal}
          onClose={() => setShowAddFormatModal(false)}
          onSuccess={() => {
            setShowAddFormatModal(false);
            fetchMetadata();
          }}
        />
        <AddAgeRatingModal
          open={showAddAgeRatingModal}
          onClose={() => setShowAddAgeRatingModal(false)}
          onSuccess={() => {
            setShowAddAgeRatingModal(false);
            fetchMetadata();
          }}
        />
      </div>
    )
  );
} 