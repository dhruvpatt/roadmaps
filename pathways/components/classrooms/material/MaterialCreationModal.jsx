import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, X, Megaphone, MessageCircle, Link as LinkIcon, FileText, Edit } from "lucide-react";
import { ContentSection } from "../ContentSection";
import { TYPE_META } from "./MaterialTypeMeta";
import { EditableContentItem } from "../EditableContentItem";
import { PendingInputList } from "../PendingInputList";



const MAX_LINKS = 25;
const MAX_FILES = 10;

function sortedContent(content) {
  const title = content.filter(c => c.type === "title");
  const announcement = content.filter(c => c.type === "announcement");
  const general = content.filter(c => c.type === "general");
  const links = content.filter(c => c.type === "link");
  const files = content.filter(c => c.type === "file");
  return [...title, ...announcement, ...general, ...links, ...files];
}

export default function MaterialCreationModal({
  open,
  onClose,
  onSave,
  initialData = {},
  isEditing = false,
}) {
  const [formData, setFormData] = useState(() => {
    const initialContent = Array.isArray(initialData.content)
      ? initialData.content.map(item => ({ ...item, id: item.id || crypto.randomUUID() }))
      : [];

    if (initialData.title) {
      initialContent.unshift({
        id: crypto.randomUUID(),
        type: "title",
        text: initialData.title,
      });
    }

    return {
      content: sortedContent(initialContent),
    };
  });

  // pendingInputs: [{type, value}]
  const [pendingInputs, setPendingInputs] = useState([]);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [errors, setErrors] = useState({});
  const [pendingError, setPendingError] = useState("");
  const hasTitleOrAnnouncement =
    formData.content.some(c => c.type === "announcement" || c.type === "title") ||
    pendingInputs.some(p => p.type === "title" || p.type === "announcement");

  useEffect(() => {
    if (pendingError) {
      setPendingError("");
    }
  }, [
    formData.content,
    pendingInputs,
    editingValue,
    editingIdx,
  ]);


  // --- Helpers ---
  const canAdd = (type) => {
    if (type === "announcement") {
      return !formData.content.some(c => c.type === "announcement") &&
        !pendingInputs.some(p => p.type === "announcement") &&
        !formData.title;
    }
    if (type === "general") {
      return !formData.content.some(c => c.type === "general") &&
        !pendingInputs.some(p => p.type === "general");
    }
    if (type === "link") {
      return formData.content.filter(c => c.type === "link").length +
        pendingInputs.filter(p => p.type === "link").length < MAX_LINKS;
    }
    if (type === "file") {
      return formData.content.filter(c => c.type === "file").length +
        pendingInputs.filter(p => p.type === "file").length < MAX_FILES;
    }
    if (type === "title") {
      return !formData.content.some(c => c.type === "title") && !pendingInputs.some(p => p.type === "title") &&
        !formData.content.some(c => c.type === "announcement") &&
        !pendingInputs.some(p => p.type === "announcement");
    }
    return true;
  };


  function addContentSorted(item) {
    setFormData(prev => {
      const withoutItem = prev.content.filter(c => c.id !== item.id);
      let newContent = [...withoutItem, item];
      return { ...prev, content: sortedContent(newContent) };
    });
  }

  const removeContent = (id) => {

    console.log("Removing content with ID:", id);
    console.log("Current content:", formData.content);
    setFormData(prev => ({
      ...prev,
      content: prev.content.filter(item => item.id !== id),
    }));
  };


  const removePending = (id) => {
    setPendingInputs(prev => prev.filter(p => p.id !== id));
  };

  const confirmPending = (type, idx) => {
    let seen = -1;
    const pending = pendingInputs.find((p) => {
      if (p.type === type) seen++;
      return seen === idx;
    });

    if (!pending || !pending.value) return;

    const newItem = (type === "announcement" || type === "general" || type === "title")
      ? { id: pending.id, type, text: pending.value }
      : type === "link"
        ? { id: pending.id, type, link: pending.value }
        : type === "file"
          ? { id: pending.id, type, ...pending.value }
          : null;


    console.log("Adding new item:", newItem);

    if (newItem) {
      addContentSorted(newItem);
      removePending(pending.id);
    }
  };



  const handlePendingChange = (type, idx, value) => {
    let seen = -1;
    setPendingInputs(inputs =>
      inputs.map((input, i) => {
        if (input.type === type) seen++;
        return input.type === type && seen === idx ? { ...input, value } : input;
      })
    );
  };

  // Inline edit
  const startEdit = (type, id, item) => {
    console.log("Starting edit for type:", type, "id:", id, "item:", item);
    setEditingIdx({ type, id });
    setEditingValue(item.text || item.link || "");
  };

  const saveEdit = (type, id) => {

    setFormData(prev => ({
      ...prev,
      content: prev.content.map((c) =>
        c.id === id ?
          { ...c, ...(c.type === "link" ? { link: editingValue } : { text: editingValue }) }
          : c
      )
    }));
    setEditingIdx(null);
    setEditingValue("");
  };


  const addPending = (type) => {
    setPendingInputs(prev => [...prev, { type, value: "", id: crypto.randomUUID() }]);
    console.log('pending added')
  };

  const handleFileUpload = async (e, type, idx) => {
    const file = e.target.files[0];
    if (!file) return;
    const pending = pendingInputs.find((p, i) => p.type === type && i === idx);
    const id = pending?.id || crypto.randomUUID();

    const newItem = {
      id,
      type: "file",
      filename: file.name,
      url: URL.createObjectURL(file),
      mimetype: file.type,
      file,
    };

    addContentSorted(newItem);

    if (pending) {
      removePending(pending.id);
    }

  };



  const handleMultiFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const existingCount = formData.content.filter(f => f.type === "file").length;
    const allowedCount = MAX_FILES - existingCount;

    const filesToAdd = files.slice(0, allowedCount);

    filesToAdd.forEach((file) => {
      const id = crypto.randomUUID();
      const newItem = {
        id,
        type: "file",
        filename: file.name,
        url: URL.createObjectURL(file),
        mimetype: file.type,
        file,
      };
      addContentSorted(newItem);
    });

    // Clear input so re-uploading the same file works
    e.target.value = "";
  };


  const handleSubmit = () => {
    const newErrors = {};
    const hasTitle = formData.content.some(c => c.type === "title");
    const hasAnnouncement = formData.content.some(c => c.type === "announcement");
    const hasContentNotTitle = formData.content.some(c => c.type !== "title" && c.type !== "announcement");

    if (!hasTitle && !hasAnnouncement) {
      newErrors.title = "Either a title or an announcement is required.";
    }
    if (formData.content.length === 0 || !hasContentNotTitle) {
      newErrors.content = "Add at least one content item.";
    }

    if (pendingInputs.length > 0) {
      setPendingError("All content fields must be set before submitting.");
      return;
    }

    setErrors(newErrors);
    setPendingError("");
    if (Object.keys(newErrors).length > 0) return;
    onSave(formData);
    onClose();
  };

  const pendingByType = {
    title: [],
    announcement: [],
    general: [],
    link: [],
    file: [],
  };
  pendingInputs.forEach((input, idx) => {
    pendingByType[input.type].push({ ...input, idx });
  });





  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-6xl px-0 pt-0 max-h-[calc(100vh-64px)] overflow-y-auto flex-1 min-w-0"
      >
        <DialogHeader className="flex-1 min-w-0 w-full bg-gradient-to-r from-blue-50 via-amber-50 to-green-50 rounded-t-xl px-6 py-5 shadow-sm">
          <DialogTitle className="text-2xl font-semibold text-gray-900 ">
            {isEditing ? "Edit Material" : "Add New Material"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 space-y-3 min-w-0">
          {/* TITLE + ANNOUNCEMENT BADGE */}
          
          <div>
            <div className="mb-1 font-bold text-lg text-gray-700 mt-2">Add:</div>
            <p className="text-m text-gray-500 mb-2">
              Choose one: Use a <strong>title</strong> or an <strong>announcement</strong> badge to label your material.
            </p>

            {!hasTitleOrAnnouncement && (
              <div className="flex gap-3 flex-wrap items-center">
                <Button
                  className={`${TYPE_META.title.btn} font-semibold rounded-xl px-4 py-2 disabled:opacity-40`}
                  onClick={() => addPending("title")}
                  disabled={hasTitleOrAnnouncement}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Add Title
                </Button>
                <h1 className="text-gray-500 font-bold">Or</h1>
                <Button
                  className={`${TYPE_META.announcement.btn} font-semibold rounded-xl px-4 py-2 disabled:opacity-40`}
                  onClick={() => addPending("announcement")}
                  disabled={hasTitleOrAnnouncement}
                >
                  <Megaphone className="w-4 h-4 mr-2" />
                  Add Announcement
                </Button>
              </div>
            )}

            {/* Title Input */}
            <PendingInputList
              type="title"
              entries={pendingByType.title}
              confirm={confirmPending}
              remove={removePending}
              handleChange={handlePendingChange}
            />


            {/* Saved Title */}
            {formData.content
              .filter(c => c.type === "title")
              .map((c) => (
                <EditableContentItem
                  key={`title-${c.id}`}
                  type="title"
                  idx={c.id} // pass ID instead of index
                  item={c}
                  icon={FileText}
                  color={TYPE_META.title.color}
                  border={TYPE_META.title.border}
                  editingIdx={editingIdx}
                  editingValue={editingValue}
                  setEditingValue={setEditingValue}
                  onStartEdit={(type, id, item) => startEdit(type, id, item)}
                  onSaveEdit={(type, id) => saveEdit(type, id)}
                  onCancelEdit={() => setEditingIdx(null)}
                  onRemove={(type, id) => removeContent(id)}
                  canEdit
                />
              ))}




            {/* Announcement Input */}
            <PendingInputList
              type="announcement"
              entries={pendingByType.announcement}
              isTextarea
              confirm={confirmPending}
              remove={removePending}
              handleChange={handlePendingChange}
            />

            {formData.content
              .filter(c => c.type === "announcement")
              .map((c) => (
                <EditableContentItem
                  key={`announcement-${c.id}`} // ✅ unique key
                  type="announcement"
                  idx={c.id}                   // ✅ use c.id instead of index
                  item={c}
                  icon={Megaphone}
                  color={TYPE_META.announcement.color}
                  border={TYPE_META.announcement.border}
                  editingIdx={editingIdx}
                  editingValue={editingValue}
                  setEditingValue={setEditingValue}
                  onStartEdit={(type, id, item) => startEdit(type, id, item)}
                  onSaveEdit={(type, id) => saveEdit(type, id)}
                  onCancelEdit={() => setEditingIdx(null)}
                  onRemove={(type, id) => removeContent(id)}
                  isTextarea
                  canEdit
                />
              ))}

          </div>

          {/* GENERAL SECTION */}
          <div>
            <div className="mb-1 font-bold text-lg text-gray-700">Add: General Details</div>
            <p className="text-m text-gray-500 mb-2">
              Add a general note or context. It will appear in the material header.
            </p>

            {!formData.content.some(c => c.type === "general") && pendingByType.general.length === 0 && (
              <Button
                className={`${TYPE_META.general.btn} font-semibold rounded-xl px-4 py-2`}
                onClick={() => addPending("general")}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                General Badge
              </Button>
            )}

            <PendingInputList
              type="general"
              entries={pendingByType.general}
              isTextarea
              confirm={confirmPending}
              remove={removePending}
              handleChange={handlePendingChange}
            />


            {formData.content
              .filter(c => c.type === "general")
              .map((c) => (
                <EditableContentItem
                  key={`general-${c.id}`}        // ✅ Use unique key
                  type="general"
                  idx={c.id}                     // ✅ Use id instead of index
                  item={c}
                  icon={MessageCircle}
                  color={TYPE_META.general.color}
                  border={TYPE_META.general.border}
                  editingIdx={editingIdx}
                  editingValue={editingValue}
                  setEditingValue={setEditingValue}
                  onStartEdit={(type, id, item) => startEdit(type, id, item)}
                  onSaveEdit={(type, id) => saveEdit(type, id)}
                  onCancelEdit={() => setEditingIdx(null)}
                  onRemove={(type, id) => removeContent(id)}
                  isTextarea
                  canEdit
                />
              ))}



          </div>

          {/* LINKS AND FILES SECTION */}
          <div>
            <div className="mb-1 font-bold text-lg text-gray-700">Add: Additional Content</div>
            <p className="text-m text-gray-500 mb-2">Attach links or files students can view or download.</p>

            <div className="flex gap-3 flex-wrap mb-3">
              <Button
                className={`${TYPE_META.link.btn} font-semibold rounded-xl px-4 py-2 disabled:opacity-40`}
                onClick={() => addPending("link")}
                disabled={!canAdd("link")}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Add Link
              </Button>
              <label
                htmlFor="file-upload-multi"
                className={`inline-flex items-center justify-center gap-2 text-sm font-semibold rounded-xl px-4 py-2 disabled:opacity-40 cursor-pointer transition-colors ${TYPE_META.file.btn}`}
              >
                <FileText className="w-4 h-4" />
                Add File(s)
                <input
                  id="file-upload-multi"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleMultiFileUpload}
                  disabled={!canAdd("file")}
                />
              </label>


            </div>

            <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto pr-1">
              <PendingInputList
                type="link"
                entries={pendingByType.link}
                confirm={confirmPending}
                remove={removePending}
                handleChange={handlePendingChange}
              />
              {/* <PendingInputList
                type="file"
                entries={pendingByType.file}
                isFile
                confirm={confirmPending}
                remove={removePending}
                handleChange={handlePendingChange}
                handleFileUpload={handleFileUpload}
              /> */}
            </div>
          </div>



          {/* Links Section */}
          <ContentSection
            sectionKey="links"
            label="Links"
            icon={LinkIcon}
            items={formData.content.filter(c => c.type === "link")}
            pendingItems={pendingByType.link}
            typeMeta={TYPE_META}
            editingIdx={editingIdx}
            editingValue={editingValue}
            startEdit={startEdit}
            saveEdit={saveEdit}
            setEditingIdx={setEditingIdx}
            setEditingValue={setEditingValue}
            removeContent={removeContent}
            handlePendingChange={handlePendingChange}
            confirmPending={confirmPending}
            removePending={removePending}
            canEdit={true}
            canCollapse={true}
          />

          {/* Files Section */}
          <ContentSection
            sectionKey="files"
            label="Files"
            icon={FileText}
            items={formData.content.filter(c => c.type === "file")}
            pendingItems={pendingByType.file}
            typeMeta={TYPE_META}
            editingIdx={editingIdx}
            editingValue={editingValue}
            startEdit={startEdit}
            saveEdit={saveEdit}
            setEditingIdx={setEditingIdx}
            setEditingValue={setEditingValue}
            removeContent={removeContent}
            handlePendingChange={handlePendingChange}
            confirmPending={confirmPending}
            removePending={removePending}
            handleFileUpload={handleFileUpload}
            canEdit={false}
            canCollapse={true}
          />

          {/* Errors */}
          {Object.values(errors).length > 0 && (
            <p className="text-sm text-red-500 mt-3">
              {Object.values(errors).map((err, i) => (
                <React.Fragment key={i}>
                  {err}
                  <br />
                </React.Fragment>
              ))}
            </p>
          )}
          {pendingError && (
            <p className="text-sm text-red-500 mt-1">{pendingError}</p>
          )}
        </div>

        <DialogFooter className="mr-6 flex-row flex justify-end items-center pt-5 gap-3">
          <DialogClose asChild>
            <Button variant="cancel">Cancel</Button>
          </DialogClose>
          <Button
            variant="ok"
            onClick={handleSubmit}
            disabled={pendingInputs.length > 0 || editingIdx != null}
          >
            {isEditing ? "Update" : "Add"}
          </Button>
          {pendingError && (
            <p className="text-sm text-red-500 mt-1">{pendingError}</p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

MaterialCreationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  isEditing: PropTypes.bool,
};
