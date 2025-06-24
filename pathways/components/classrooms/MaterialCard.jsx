import React from "react";
import PropTypes from "prop-types";
import {
  FileText,
  ImageIcon,
  Video,
  Link2,
  Megaphone,
  MessageCircle,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import backendUrl from "@backendUrl";
import CardDropdownMenu from "@components/CardDropdownMenu";
import { TYPE_META, fileIcon } from "./MaterialTypeMeta";


function AnnouncementBadges({ contents = [], limit = 1 }) {
  const items = contents.slice(0, limit);
  if (!items.length) return null;
  return (
    <div className="flex flex-col gap-2 mt-2">
      {items.map((c, i) => (
        <div
          key={i}
          className="inline-flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-semibold w-fit max-w-full bg-amber-100 text-amber-700"
          style={{ maxWidth: "95%" }}
          title={c.text}
        >
          <Megaphone className="w-5 h-5 text-amber-500 mt-0.5" />
          <span className="text-lg font-bold leading-snug break-words line-clamp-1">
            {c.text}
          </span>
        </div>
      ))}
    </div>
  );
}


function GeneralBadges({ contents = [], limit = 1 }) {
  const items = contents.slice(0, limit);
  if (!items.length) return null;
  return (
    <div className="flex flex-col gap-2 mt-2">
      {items.map((c, i) => (
        <div
          key={i}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold w-fit max-w-full bg-gray-100 text-gray-700"
          style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "95%" }}
          title={c.text}
        >
          <MessageCircle className="w-5 h-5 text-gray-500" />
          <span className="truncate">{c.text}</span>
        </div>
      ))}
    </div>
  );
}

function FadeRowPreview({ children }) {
  return (
    <div className="relative mt-2 overflow-hidden">
      <div
        className="flex gap-3 pr-6"
        style={{
          maskImage: "linear-gradient(to right, black 80%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, black 80%, transparent)"
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function MaterialCard({
  material,
  onEdit,
  onDelete,
  onClick,
  formatDate,
  menu = true
}) {
  const contentArr = Array.isArray(material.content) ? material.content : [];

  const files = contentArr.filter((c) => c.type === "file");
  const links = contentArr.filter((c) => c.type === "link");
  const announcements = contentArr.filter((c) => c.type === "announcement");
  const generals = contentArr.filter((c) => c.type === "general");

  const typeBadges = (material.types || []).map((t) => (
    <span
      key={t.key}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize mr-1",
        TYPE_META[t.key]?.badge || "bg-gray-100 text-gray-700"
      )}
    >
      {t.label || t.key}
    </span>
  ));

  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-md p-6 transition cursor-pointer border border-gray-100 hover:shadow-lg relative flex flex-col",
        "material-card"
      )}
      onClick={onClick}
    >
      {menu && (
        <div className="absolute top-4 right-4 z-10">
          <CardDropdownMenu
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">More</span>
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            }
            items={[
              {
                label: "Edit",
                onClick: () => onEdit?.(material)
              },
              {
                label: "Delete",
                onClick: () => onDelete?.(material.id),
                className: "text-red-600"
              }
            ]}
            align="right"
          />
        </div>
      )}

      <div className="mb-2 flex flex-wrap gap-1">{typeBadges}</div>

      <h3 className="font-semibold text-gray-900 text-lg truncate max-w-full">
        {material.title || <AnnouncementBadges contents={announcements} limit={1} />
        }
      </h3>

      {generals.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1 min-w-0">
          <MessageCircle className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="min-w-0">
            <span className="line-clamp-2 break-words whitespace-pre-wrap text-sm">
              {generals[0].text}
            </span>
          </div>
        </div>
      )}




      <FadeRowPreview>
        {files.map((f, i) => (
          <a
            key={i}
            href={`${backendUrl}${f.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "min-w-[90px] max-w-[120px] rounded-xl px-2 py-1 flex flex-col items-center gap-1 cursor-pointer transition border border-blue-100",
              TYPE_META.file.badge
            )}
            onClick={(e) => { e.stopPropagation(); }}
          >
            {fileIcon(f.mimetype, f.filename)}
            <span className="block text-xs text-blue-900 font-medium max-w-[88px] truncate text-center">
              {f.filename || "File"}
            </span>
          </a>
        ))}
      </FadeRowPreview>

      <FadeRowPreview>
        {links.map((l, i) => (
          <a
            key={i}
            href={l.link}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full border border-green-200 text-green-800 text-xs font-semibold max-w-[180px] truncate hover:bg-green-100 transition",
              TYPE_META.link.badge
            )}
            title={l.link}
            onClick={(e) => { e.stopPropagation(); }}

          >
            {React.createElement(TYPE_META.link.icon, { className: "w-4 h-4" })}
            <span className="truncate">{l.link}</span>
          </a>
        ))}
      </FadeRowPreview>

      <div className="flex items-center text-xs text-gray-500 gap-1 mt-2">
        <span>
          By {material.created_by?.first_name || "Unknown"}
          {material.created_by?.last_name ? ` ${material.created_by.last_name}` : ""}
        </span>
        <span className="mx-1">•</span>
        <span>{formatDate(material.created_at || material.uploadedAt, true)}</span>
      </div>
    </div>
  );
}

MaterialCard.propTypes = {
  material: PropTypes.object.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onClick: PropTypes.func,
  formatDate: PropTypes.func,
  menu: PropTypes.bool
};
