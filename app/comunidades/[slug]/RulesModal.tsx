"use client";

import { Modal, Button } from "@heroui/react";
import { BookOpen } from "@gravity-ui/icons";

interface RulesModalProps {
    rules: string;
}

export default function RulesModal({ rules }: RulesModalProps) {
    return (
        <Modal>
            <Modal.Trigger>
                <Button
                    variant="outline"
                    className="font-semibold border-[var(--border)] hover:bg-[var(--surface-secondary)] hover:border-[var(--border-hover)] transition-all"
                >
                    <span className="flex items-center gap-2"><BookOpen className="size-4" /> Ver Reglas</span>
                </Button>
            </Modal.Trigger>
            <Modal.Backdrop className="bg-black/50 backdrop-blur-sm">
                <Modal.Container>
                    <Modal.Dialog className="bg-[var(--bg-solid)] text-[var(--foreground)] border border-[var(--border)] rounded-2xl p-4 shadow-2xl">
                        <Modal.CloseTrigger className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)] bg-[var(--surface-secondary)] rounded-full p-1" />
                        <Modal.Header>
                            <Modal.Heading className="text-xl font-bold">Reglas de la Comunidad</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body className="py-4">
                            <div className="whitespace-pre-wrap text-sm leading-relaxed max-h-[60vh] overflow-y-auto">
                                {rules}
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="flex justify-end pt-4 border-t border-[var(--border)]">
                            <Modal.CloseTrigger>
                                <Button variant="primary" className="bg-[var(--accent)] text-[var(--accent-foreground)] font-bold">
                                    Entendido
                                </Button>
                            </Modal.CloseTrigger>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
