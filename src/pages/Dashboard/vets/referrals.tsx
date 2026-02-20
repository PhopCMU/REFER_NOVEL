import { useEffect, useRef, useState } from "react";
import { getUserFromToken } from "../../../utils/authUtils";
import type { FormOwnerProp, PayloadFetchOwner } from "../../../types/type";
import { showToast } from "../../../utils/showToast";
import { GetOwners } from "../../../api/GetApi";
import { LoadingForm } from "../../../component/LoadingForm";
import { useConfirmTailwind } from "../../../hook/useConfirmTailwind";
import { ToastContainer } from "react-toastify";

// Mokup data
const ServiceRequested = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", // UUID for ServiceRequested entry
    special: {
      name: "Special",
      type: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          code: "DERM",
          name: "คลินิกโรคผิวหนัง",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          code: "OPH",
          name: "คลินิกโรคตา",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440002",
          code: "DENT",
          name: "คลินิกช่องปากและทันตกรรม",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440003",
          code: "ORTH",
          name: "คลินิกกระดูกและข้อต่อ",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440004",
          code: "CARD",
          name: "คลินิกหัวใจและหลอดเลือด",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440005",
          code: "NEURO",
          name: "คลินิกระบบประสาทและสมอง",
        }, // Fixed duplicate: was "NEU"
        {
          id: "550e8400-e29b-41d4-a716-446655440006",
          code: "FEL",
          name: "คลินิกโรคแมว",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440007",
          code: "ONC",
          name: "คลินิกโรคเนื้องอก",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440008",
          code: "PT",
          name: "คลินิกกายภาพบำบัด",
        }, // Fixed duplicate: was "NEU"
        {
          id: "550e8400-e29b-41d4-a716-446655440009",
          code: "ENDO",
          name: "คลินิกฮอร์โมนและต่อมไร้ท่อ",
        },
        {
          id: "550e8400-e29b-41d4-a716-44665544000a",
          code: "GI",
          name: "คลินิกระบบทางเดินอาหาร",
        },
        {
          id: "550e8400-e29b-41d4-a716-44665544000b",
          code: "NEPH",
          name: "คลินิกโรคไต",
        },
        {
          id: "550e8400-e29b-41d4-a716-44665544000c",
          code: "ACU",
          name: "คลินิกฝั่งเข็ม",
        },
        {
          id: "550e8400-e29b-41d4-a716-44665544000d",
          code: "EXOT",
          name: "คลินิกสัตว์ชนิดพิเศษ",
        },
        {
          id: "550e8400-e29b-41d4-a716-44665544000e",
          code: "AQUA",
          name: "คลินิกสัตว์น้ำ",
        },
      ],
    },
  },
];
export default function ReferralsPage() {
  // === Get user login === //
  const userLogin = getUserFromToken()!;
  // === State === //
  const [owners, setOwners] = useState<FormOwnerProp[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [expandedOwner, setExpandedOwner] = useState<string>("");
  // === Loiading === //
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  // === Confirm === //
  const { confirm, ConfirmModal } = useConfirmTailwind();

  // === useEffect === //
  const useRefFetchDataOwners = useRef(false);
  useEffect(() => {
    if (useRefFetchDataOwners.current) return;
    useRefFetchDataOwners.current = true;
    fetchDataOwners();
  }, []);

  const fetchDataOwners = async () => {
    const veterinarianId = userLogin?.id;
    const hospitalId = userLogin?.hospitalId;

    if (!veterinarianId || !hospitalId) {
      showToast.error("Missing veterinarianId or hospitalId");
      return;
    }

    const payload: PayloadFetchOwner = {
      veterinarianId,
      hospitalId,
    };

    setMessage("Fetching owners...");
    setLoading(true);

    try {
      const resp = await GetOwners(payload);

      if (!resp.success) {
        showToast.error("Error fetching owners");
        return;
      }
      // console.log("resp", resp._data);
      if (resp._data.length === 0) {
        showToast.error("No owners found");
        return;
      }
      setOwners(resp._data || []);

      setMessage("");

      setLoading(false);
    } catch (error) {
      console.error("Error fetching owners:", error);
      setMessage("");
      setLoading(false);
    } finally {
      setMessage("");
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingForm text={message} />;
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Confirm Modal */}
      <ConfirmModal />
      {/* Toast Notification */}
      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
      <div>
        <h1>Referrals</h1>
      </div>
    </div>
  );
}
