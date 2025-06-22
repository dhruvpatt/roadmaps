import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  description = "",
  onOk,
  onCancel,
  showOk = true,
  showCancel = true,
  okText = "OK",
  cancelText = "Cancel",
}) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description && <p className="text-gray-600 mt-2">{description}</p>}
        <DialogFooter className="flex justify-end gap-2 mt-6">
          {showCancel && (
            <Button variant="cancel" onClick={onCancel}>
              {cancelText}
            </Button>
          )}
          {showOk && (
            <Button variant="destructive" onClick={onOk}>
              {okText}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  onOk: PropTypes.func,
  onCancel: PropTypes.func,
  showOk: PropTypes.bool,
  showCancel: PropTypes.bool,
  okText: PropTypes.string,
  cancelText: PropTypes.string,
};
